var Promise = require("bluebird");
var spawn = require("child_process").spawn;
var assert = require("assert");
var argv = require("optimist").argv;
var ARGS = [].concat(
    process.execArgv,
    __filename,
    process.argv.slice(2)
);
function sanitizeCpCount(input) {
    return Math.min(Math.max(1, (+input | 0)), 16);
}

if (typeof argv["child-processes"] === "number") {
    var CHILD_PROCESSES = sanitizeCpCount(argv["child-processes"]);
} else if (process.env.CHILD_PROCESSES) {
    var CHILD_PROCESSES = sanitizeCpCount(process.env.CHILD_PROCESSES);
} else {
    var CHILD_PROCESSES = 4;
}


var debugging = false;

function debug() {
    if (debugging) {
        var msg = [].slice.call(arguments).join(" ");
        console.log(msg);
    }
}

function ResultWithOutput(result, stdout, stderr) {
    this.result = result;
    this.stdout = stdout;
    this.stderr = stderr;
}

var jobRunner = (function() {
    var taskId = 0;
    var workerCount;
    var workers = [];
    var tasks = [];
    var killed = true;

    function leastTotalRunningTime(a, b) {
        return a.totalRunningTime() - b.totalRunningTime();
    }

    function each(fn) {
        if (typeof fn === "string") {
            var args = [].slice.call(arguments, 1);
            return workers.forEach(function(worker) {
                worker[fn].apply(worker, args);
            });
        }
        return workers.forEach(fn);
    }

    function retLogger(result) {
        if (result instanceof ResultWithOutput) {
            process.stdout.write(result.stdout);
            process.stderr.write(result.stderr);
        }
        return result;
    }

    function throwLogger(result) {
        if (result && (result.stderr || result.stdout)) {
            process.stdout.write(result.stdout);
            process.stderr.write(result.stderr);
        }
        throw result;
    }

    function reinit() {
        each("init");
    }

    function checkShutDown(secondCheck) {
        if (tasks.length > 0) return;
        var anyWorkerHasTasks = workers.some(function(w) {
            return w.hasTasks();
        });
        if (anyWorkerHasTasks) return;
        if (secondCheck) return ret.exit();
        setTimeout(function() {
            checkShutDown(true);
        }, 10);
    }

    function schedule(task, queued) {
        var worker = workers.filter(function(worker) {
            return task.isolated ?
                !worker.hasTasks() : !worker._runningIsolatedTask;
        }).sort(leastTotalRunningTime)[0];

        if (!worker) {
            if (!queued) tasks.push(task);
            return false;
        } else {
            assert(task.isolated ? !worker.hasTasks() : true);
            debug("found free worker", worker._id, "for task", task.id);
            worker.performTask(task);
            return true;
        }
    }

    var ret = {
        init: function(requirePath, initTaskFn) {
            if (workers.length) return;
            if (typeof requirePath !== "string") throw new TypeError();
            var count = CHILD_PROCESSES;
            workerCount = count;
            var id = 0;
            for (var i = 0; i < count; ++i) {
                workers.push(new Worker(id++, requirePath, initTaskFn));
            }
            process.on("exit", ret.exit);
        },

        exit: function() {
            if (killed) return;
            killed = true;
            each("kill");
        },

        run: function(task, opts) {
            if (!workerCount) throw new Error("task runner has not been initialized");
            if (typeof task !== "function") throw new TypeError("fn not function");
            if (killed) {
                killed = false;
                reinit();
            }
            opts = opts || {};
            var context = opts.context || {};
            var log = opts.log === false ? false : true;
            var estimate = typeof opts.estimate === "number" ? opts.estimate : null;
            var progress = typeof opts.progress === "function" ? opts.progress : null;
            var isolated = !!opts.isolated;
            var resolve, reject;
            var promise = new Promise(function() {
                resolve = arguments[0];
                reject = arguments[1];
            });
            var task = {
                isolated: isolated,
                task: {
                    code: task + "",
                    context: context
                },
                resolve: resolve,
                reject: reject,
                estimate: estimate,
                id: taskId++,
                log: log,
                progress: progress
            };
            schedule(task, false);
            if (log) promise = promise.then(retLogger, throwLogger);
            return promise;
        },

        setVerbose: function(v) {
            debugging = !!v;
        },

        _workerIdleNotification: function() {
            var _t = tasks;
            if (_t.length === 0) {
                return checkShutDown();
            }
            while(_t.length > 0) {
                var task = _t.shift();
                if (!schedule(task, true)) {
                    _t.unshift(task);
                    return;
                }
            }
        }
    };
    return ret;
})();

function Worker(id, requirePath, initTaskFn) {
    this._initTaskFn = initTaskFn;
    this._requirePath = requirePath;
    this._id = id;
    this._runningTaskCount = 0;
    this._runningIsolatedTask = false;
    this._performingIsolatedTask = false;
    this._queuedIsolatedTask = null;
    this._bufferingStdio = false;
    this._runningTime = 0;
    this._c = null;
    this._stdout = "";
    this._stderr = "";
    this._tasks = {};
    this._onStdOut = bind(this._onStdOut, this);
    this._onStdErr = bind(this._onStdErr, this);
    this._onError = bind(this._onError, this);
    this._onMessage = bind(this._onMessage, this);
}

Worker.prototype.totalRunningTime = function() {
    var ret = this._runningTime;
    var ids = Object.keys(this._tasks);
    var now = Date.now();
    for (var i = 0; i < ids.length; ++i) {
        var task = this._tasks[ids[i]];
        ret += task.estimate === null ? (now - task.started + 1): task.estimate;
    }
    return ret;
};

Worker.prototype._onStdOut = function(data) {
    data = data.toString();
    if (this._bufferingStdio) {
        this._stdout += data;
    } else {
        process.stdout.write(data);
    }
};

Worker.prototype._onStdErr = function(data) {
    data = data.toString();

    if (this._bufferingStdio) {
        this._stderr += data;
    } else {
        process.stderr.write(data);
    }
};

Worker.prototype._onError = function(e) {
    process.stderr.write(e && e.stack && e.stack + "" || (e + ""));
};

Worker.prototype._onMessage = function(payload) {
    var self = this;
    setImmediate(function() {
        self[payload.type].call(self, payload);
    });
};

Worker.prototype.removeListeners = function() {
    var c = this._c;
    c.stdout.removeListener("data", this._onStdOut);
    c.stderr.removeListener("data", this._onStdErr);
    c.removeListener("message", this._onMessage);
    c.removeListener("error", this._onError);
};

Worker.prototype.debug = function(msg, task) {
    debug("worker", this._id, msg, (task.isolated ?
        "isolated" : ""), "task", task.id);
};

Worker.prototype.hasTasks = function() {
    return this.runningTaskCount() > 0 ||
        this._queuedIsolatedTask ||
        this._runningIsolatedTask;
};

Worker.prototype.runningTaskCount = function() {
    return this._runningTaskCount;
};

Worker.prototype.performTask = function(task) {
    if (task !== this._queuedIsolatedTask) {
        assert(!this._runningIsolatedTask);
        if (task.isolated) {
            this._runningIsolatedTask = true;
            if (this.runningTaskCount() > 0) {
                this.debug("queued", task);
                this._queuedIsolatedTask = task;
                return;
            } else {
                assert(this._queuedIsolatedTask === null);
                this._performingIsolatedTask = true;
            }
        }
    } else {
        assert(this.runningTaskCount() === 0);
        assert(this._runningIsolatedTask);
        this._queuedIsolatedTask = null;
        this._performingIsolatedTask = true;
    }
    this._runningTaskCount++;
    assert(this._performingIsolatedTask ? this._runningTaskCount === 1 : true);
    this._tasks[task.id] = task;
    task.started = Date.now();
    this.debug("starts to perform", task);
    this._c.send({
        type: "newTask",
        id: task.id,
        task: task.task,
        isolated: task.isolated,
        log: task.log,
        progress: !!task.progress
    });

};

function getFunctionSource(fn) {
   return (fn + "")
        .replace(/^\s*function\s*\(\s*\)\s*{/, "")
        .replace(/}\s*$/, "");
}

Worker.prototype.init = function() {
    assert(Array.isArray(ARGS));
    assert(!this._c);
    var env = {};
    Object.getOwnPropertyNames(process.env).forEach(function(key) {
        env[key] = process.env[key];
    });
    env.requirePath = this._requirePath;
    if (typeof this._initTaskFn === "function") {
        env.initialCode = getFunctionSource(this._initTaskFn);
    }

    var c = spawn(process.execPath, ARGS, {
        env: env,
        stdio: ["pipe", "pipe", "pipe", "ipc"],
        cwd: this._requirePath
    });
    assert(typeof c.send === "function");
    this._c = c;
    c.stdout.on("data", this._onStdOut);
    c.stderr.on("data", this._onStdErr);
    c.on("error", this._onError);
    c.on("message", this._onMessage);
};

Worker.prototype.taskComplete = function(payload) {
    var task = this._tasks[payload.id];
    this.debug("completed", task);
    delete this._tasks[payload.id];
    this._runningTaskCount--;
    var resolve, result;
    if (payload.isError) {
        resolve = task.reject;
        var err = payload.error;
        if (err.__isErrorInstance__) {
            result = new Error();
            Object.keys(err).forEach(function(key) {
                if (key === "__isErrorInstance__") return;;
                result[key] = err[key];
            });
            result.name = err.name;
            result.stack = err.stack;
            result.message = err.message;
        } else {
            result = err;
        }
    } else {
        resolve = task.resolve;
        result = payload.result;
    }
    if (this._runningIsolatedTask) {
        if (this._queuedIsolatedTask) {
            if (this.runningTaskCount() === 0) {
                this.performTask(this._queuedIsolatedTask);
            }
        } else {
            if (payload.error) {
                result.stdout = this._stdout;
                result.stderr = this._stderr;
            } else {
                result = new ResultWithOutput(result, this._stdout, this._stderr);
            }
            this._stderr = this._stdout = "";
            this._performingIsolatedTask = false;
            this._runningIsolatedTask = false;
            this._bufferingStdio = false;
            this.kill();
            this.init();
        }
    }
    resolve(result);
    if (!this._runningIsolatedTask) {
        jobRunner._workerIdleNotification();
    }
};

Worker.prototype.kill = function() {
    if (this._c) {
        this.removeListeners();
        this._c.kill("SIGKILL");
        this._c = null;
    }
};

Worker.prototype.progress = function(payload) {
    var id = payload.id;
    var task = this._tasks[id];
    if (task && typeof task.progress === "function") {
        task.progress.call(undefined, payload.value);
    }
};

Worker.prototype.outputFlushed = function() {
    this._bufferingStdio = true;
    this._c.send({type: "outputFlushedAck"});
};



function bind(fn, ctx) {return function() {return fn.apply(ctx, arguments); };}


function getTaskFunction(context, code) {
    with (context) {
        return eval( "(" + code + ")");
    }
}

if (require.main === module) {
    var __requirePath = process.env.requirePath;
    var __oldreq = require;
    var __path = require("path");
    require = function(p) {
        if (p.charAt(0) === ".") {
            p = __path.join(__requirePath, p);
        }
        return __oldreq(p);
    };
    if (process.env.initialCode) {
        eval(process.env.initialCode);
    }
    (function() {
        function waitForOutput() {
            return new Promise(function(resolve, reject) {
                var flushCount = 0;
                function onFlushed() {
                    flushCount++;
                    if (flushCount === 2) {
                        resolve();
                    }
                }
                function checkStream(stream) {
                    if (stream.bufferSize === 0) {
                        onFlushed();
                    } else {
                        stream.write("", "utf-8", onFlushed);
                    }
                }
                checkStream(process.stdout);
                checkStream(process.stderr);
            });
        }

        function waitForPreviousOutput(id) {
            return waitForOutput().then(function() {
                var ret = waitForFlushAck(id);
                process.send({type: "outputFlushed", id: id});
                return ret;
            });
        }

        var ackWaitResolve = null;
        function waitForFlushAck(id) {
            assert(ackWaitResolve === null);
            return new Promise(function(resolve) {
                ackWaitResolve = resolve;
            });
        }
        var noop  = function() {};
        var noopWrite = function(_, a, b) {
            if (typeof a === "function") return a();
            if (typeof b === "function") return b();
        };

        function toSerializableError(err) {
            if (err instanceof Error) {
                var ret = Object.create(null);
                Object.keys(err).forEach(function(key){
                    ret[key] = err[key];
                });
                ret.name = err.name;
                ret.stack = err.stack;
                ret.message = err.message;
                ret.__isErrorInstance__ = true;
                return ret;
            } else {
                return err;
            }
        }

        var actions = {
            newTask: function(payload) {
                var task = payload.task;
                var code = task.code;
                var context = task.context;
                var id = payload.id;
                var promise = payload.isolated
                                    ? waitForPreviousOutput(id) : Promise.resolve();


                return promise
                    .then(function() {
                        if (payload.log === false && payload.isolated) {
                            process.stdout.write = noopWrite;
                        }
                        var fn = getTaskFunction(context, code);
                        if (typeof fn !== "function")
                            throw new Error("fn must be function");
                        return fn(payload.progress ? function(value) {
                            process.send({type: "progress", id: id, value: value});
                        } : noop);
                    })
                    .finally(function() {
                        if (payload.isolated) {
                            return waitForOutput();
                        }
                    })
                    .then(function(result) {
                        process.send({
                            type: "taskComplete",
                            id: payload.id,
                            result: result
                        });
                    })
                    .catch(function(error) {
                        process.send({
                            type: "taskComplete",
                            id: payload.id,
                            error: toSerializableError(error),
                            isError: true
                        });
                    });
            },

            outputFlushedAck: function() {
                var resolve = ackWaitResolve;
                ackWaitResolve = null;
                resolve();
            },

            addGlobals: function(payload) {
                new Function(payload.code)();
            }
        };

        process.on("message", function(payload) {
            setImmediate(function() {
                actions[payload.type].call(actions, payload);
            });
        });
    })();
} else {
    module.exports = jobRunner;
    Object.defineProperty(module.exports, "CHILD_PROCESSES", {
        value: CHILD_PROCESSES,
        writable: false
    });
}
