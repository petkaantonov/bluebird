!function(e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(e):"undefined"!=typeof window?window.liar=e():"undefined"!=typeof global?global.liar=e():"undefined"!=typeof self&&(self.liar=e())}(function(){var define,module,exports;
return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var promise = require('lie');
promise.use = require('lie-use');
promise.resolve = require('lie-resolve');
promise.reject = require('lie-reject');
promise.all = require('lie-all');
promise.race = require('lie-race');
promise.cast = require('lie-cast');
promise.some = require('lie-some');
promise.map = require('lie-map');
promise.denodify = require('lie-denodify');
promise.apply = require('lie-apply');
promise.lfold = require('lie-lfold');
promise.rfold = require('lie-rfold');
promise.fold = require('lie-fold');
promise.zip = require('lie-zip');
promise.zipwith = require('lie-zipwith');
promise.filter = require('lie-filter');
promise.every = require('lie-every');
promise.any = require('lie-any');
module.exports = promise;
},{"lie":36,"lie-all":3,"lie-any":6,"lie-apply":8,"lie-cast":10,"lie-denodify":11,"lie-every":12,"lie-filter":13,"lie-fold":14,"lie-lfold":16,"lie-map":18,"lie-race":20,"lie-reject":22,"lie-resolve":23,"lie-rfold":24,"lie-some":26,"lie-use":29,"lie-zip":30,"lie-zipwith":33}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],3:[function(require,module,exports){
var promise = require('lie');
var cast = require('lie-cast');
var qMap = require('lie-quickmap');
var each = require('lie-quickeach');
function all(array) {
    return promise(function(fulfill, reject) {
        var len = array.length;
        if(!len){
            fulfill([]);
        }
        var fulfilled = 0;
        var out = [];
        var onSuccess = function(n) {
            return function(v) {
                out[n] = v;
                if (++fulfilled === len) {
                    fulfill(out);
                }
            };
        };
        each(qMap(array,cast),function(v, i) {
            v.then(onSuccess(i), function(a) {
                reject(a);
            });
        });
    });
}
module.exports = all;

},{"lie":36,"lie-cast":10,"lie-quickeach":4,"lie-quickmap":5}],4:[function(require,module,exports){
function quickEach(arr,func){
    var len = arr.length;
    if(!len){
        return;
    }
 var i = -1;
 while(++i<len){
     func(arr[i],i);
 }
}
module.exports = quickEach;

},{}],5:[function(require,module,exports){
function quickMap(arr,func){
    var len = arr.length;
    if(!len){
        return [];
    }
 var i = -1;
 var out = new Array(len);
 if(typeof func === 'function'){
     while(++i<len){
         out[i]=func(arr[i],i);
     }
 }else{
    while(++i<len){
        out[i]=arr[i];
    }
 }
 return out;
}
module.exports = quickMap;

},{}],6:[function(require,module,exports){
var qMap = require('lie-quickmap');
var all = require('lie-all');
var promise = require('lie');
var cast = require('lie-cast');
function any(array,func){
    var hasfunc = typeof func === 'function';
    return promise(function(yes,no){
        all(qMap(array,function(value){
            var cvalue = cast(value);
            if(hasfunc){
                cvalue = cvalue.then(func);
            }
            return cvalue.then(function(pValue){
                if(pValue){
                    yes(true);
                }else{
                    return false;
                }
            });
        })).then(function(){
            yes(false);
        },no);
    });
}
module.exports = any;
},{"lie":36,"lie-all":3,"lie-cast":10,"lie-quickmap":7}],7:[function(require,module,exports){
module.exports=require(5)
},{}],8:[function(require,module,exports){
var qMap = require('lie-quickmap');
var all = require('lie-all');
var cast = require('lie-cast');
function apply(){
    var args = qMap(arguments);
    var func = args.shift();
    if(args.length===0){
        return cast(func());
    }else if(args.length===1){
        return cast(args[0]).then(func);
    }
    return all(args).then(function(results){
        return func.apply(null,results);
    });
}
module.exports = apply;
},{"lie-all":3,"lie-cast":10,"lie-quickmap":9}],9:[function(require,module,exports){
module.exports=require(5)
},{}],10:[function(require,module,exports){
var resolve = require('lie-resolve');
function cast(thing){
    if(thing && typeof thing.then === 'function'){
        return thing;
    }else{
        return resolve(thing);
    }
}
module.exports = cast;
},{"lie-resolve":23}],11:[function(require,module,exports){
var promise = require('lie');
function denodify(func) {
    return function() {
        var args = Array.prototype.concat.apply([], arguments);
        return promise(function(resolve, reject) {
            args.push(function(err, success) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(success);
                }
            });
            func.apply(undefined, args);
        });
    };
}
module.exports = denodify;
},{"lie":36}],12:[function(require,module,exports){
var map = require('lie-map');
var cast = require('lie-cast');
function every(array,func){
    var hasfunc = typeof func === 'function';
    var code = Math.random().toString();
    return map(array,function(value){
        var cvalue = cast(value);
        if(hasfunc){
            cvalue = cvalue.then(func);
        }
        return cvalue.then(function(bool){
            if(!bool){
                throw code;
            }
            return;
        });
    }).then(function(){
        return true;
    },function(reason){
        if(reason===code){
            return false;
        }else{
            throw reason;
        }
    });
}
module.exports = every;
},{"lie-cast":10,"lie-map":18}],13:[function(require,module,exports){
var map = require('lie-map');
var zipwith = require('lie-zipwith');
function filter(array,func){
    return map(array,func).then(function(bools){
        return zipwith(function(value,keep){
            if(keep){
                return value;
            }else{
                return keep;
            }
        },array,bools);
    }).then(function(arr2){
        return arr2.filter(function(v){
            return v;
        });
    });
}
module.exports = filter;
},{"lie-map":18,"lie-zipwith":33}],14:[function(require,module,exports){
var some = require('lie-some');
var apply = require('lie-apply');
var each = require('lie-quickeach');
function fold(array,func,acc){
    return some(array).then(function(a){
            var accum = acc;
            each(a,function(value){
                if(typeof accum === 'undefined'){
                    accum = value;
                }else{
                    accum = apply(func,accum,value);
                }
            });
            return accum;
        });
}
module.exports = fold;
},{"lie-apply":8,"lie-quickeach":15,"lie-some":26}],15:[function(require,module,exports){
module.exports=require(4)
},{}],16:[function(require,module,exports){
var apply = require('lie-apply');
var each = require('lie-quickeach');
function lfold(array,func,acc){
        var accum = acc;
        each(array,function(value){
            if(typeof accum === 'undefined'){
                accum = value;
            }else{
                accum = apply(func,accum,value);
            }
        });
        return accum;
}
module.exports = lfold;
},{"lie-apply":8,"lie-quickeach":17}],17:[function(require,module,exports){
module.exports=require(4)
},{}],18:[function(require,module,exports){
var use = require('lie-use');
var all = require('lie-all');
var qMap = require('lie-quickmap');
var cast = require('lie-cast');
function map(array, func) {
    return use(array,function(arr){
        return all(qMap(arr,function(a,i){
            return cast(a).then(function(b){
                return func(b,i);
            });
        }));
    });
}
module.exports = map;

},{"lie-all":3,"lie-cast":10,"lie-quickmap":19,"lie-use":29}],19:[function(require,module,exports){
module.exports=require(5)
},{}],20:[function(require,module,exports){
var promise = require('lie');
var each = require('lie-quickeach');
function race(array) {
    return promise(function(fulfill, reject) {
        each(array,function(v){
            v.then(fulfill, reject);
        });
    });
}
module.exports = race;

},{"lie":36,"lie-quickeach":21}],21:[function(require,module,exports){
module.exports=require(4)
},{}],22:[function(require,module,exports){
var promise = require('lie');
function reject(value){
    return promise(function(yes,no){
        no(value);
    });
}
module.exports = reject;
},{"lie":36}],23:[function(require,module,exports){
var promise = require('lie');
function resolve(value){
    return promise(function(yes){
        yes(value);
    });
}
module.exports = resolve;
},{"lie":36}],24:[function(require,module,exports){
var apply = require('lie-apply');
var each = require('lie-quickeach');
function rfold(array,func,acc){
        var accum = acc;
        var len = array.length-1;
        each(array,function(_,i){
            var value = array[len-i];
            if(typeof accum === 'undefined'){
                accum = value;
            }else{
                accum = apply(func,accum,value);
            }
        });
        return accum;
}
module.exports = rfold;
},{"lie-apply":8,"lie-quickeach":25}],25:[function(require,module,exports){
module.exports=require(4)
},{}],26:[function(require,module,exports){
var promise = require('lie');
var cast = require('lie-cast');
var qMap = require('lie-quickmap');
var each = require('lie-quickeach');
function some(array) {
    return promise(function(fulfill, reject) {
        var len = array.length;
        var succeded = [];
        var failed = [];
        function check(){
            if (failed.length === len) {
                reject(failed);
            }else if((succeded.length+failed.length)===len){
                 fulfill(succeded);
            }
        }

        each(qMap(array,cast),function(v) {
            v.then(function(a) {
                succeded.push(a);
                check();
            },function(a) {
                failed.push(a);
                check();
            });
        });
    });
}
module.exports = some;

},{"lie":36,"lie-cast":10,"lie-quickeach":27,"lie-quickmap":28}],27:[function(require,module,exports){
module.exports=require(4)
},{}],28:[function(require,module,exports){
module.exports=require(5)
},{}],29:[function(require,module,exports){
function use(thing,func){
    if(typeof thing.then === 'function'){
        return thing.then(func);
    }else{
        return func(thing);
    }
}
module.exports = use;
},{}],30:[function(require,module,exports){
var map = require('lie-map');
var qMap = require('lie-quickmap');
var each = require('lie-quickeach');
function zip(){
        if(arguments.length===1){
            return map(arguments[0],function(a){
                return [a];
            });
        }
        var args = qMap(arguments);
        var min = args[0].length;
        var shortest = 0;
        each(args,function(a,i){
            var len = a.length;
            if(len<min){
                shortest = i;
                min = len;
            }
        });
        return map(args[shortest],function(_,i){
            return map(args,function(value){
                return value[i];
            });
        });
}
module.exports = zip;
},{"lie-map":18,"lie-quickeach":31,"lie-quickmap":32}],31:[function(require,module,exports){
module.exports=require(4)
},{}],32:[function(require,module,exports){
module.exports=require(5)
},{}],33:[function(require,module,exports){
var map = require('lie-map');
var qMap = require('lie-quickmap');
var each = require('lie-quickeach');
function zipwith(){
        if(arguments.length===2){
            return map(arguments[1],arguments[0]);
        }
        var args = qMap(arguments);
        var func = args.shift();
        var min = args[0].length;
        var shortest = 0;
        each(args,function(a,i){
            var len = a.length;
            if(len<min){
                shortest = i;
                min = len;
            }
        });
        return map(args[shortest],function(_,i){
            return map(args,function(value){
                return value[i];
            }).then(function(values){
                return func.apply(null,values);
            });
        });
}
module.exports = zipwith;
},{"lie-map":18,"lie-quickeach":34,"lie-quickmap":35}],34:[function(require,module,exports){
module.exports=require(4)
},{}],35:[function(require,module,exports){
module.exports=require(5)
},{}],36:[function(require,module,exports){
var immediate = require('immediate');
// Creates a deferred: an object with a promise and corresponding resolve/reject methods
function Promise(resolver) {
     if (!(this instanceof Promise)) {
        return new Promise(resolver);
    }
    var sucessQueue = [];
    var failureQueue = [];
    var resolved = false;
    // The `handler` variable points to the function that will
    // 1) handle a .then(onFulfilled, onRejected) call
    // 2) handle a .resolve or .reject call (if not fulfilled)
    // Before 2), `handler` holds a queue of callbacks.
    // After 2), `handler` is a simple .then handler.
    // We use only one function to save memory and complexity.
     // Case 1) handle a .then(onFulfilled, onRejected) call
    function pending(onFulfilled, onRejected){
        return Promise(function(success,failure){
            if(typeof onFulfilled === 'function'){
                sucessQueue.push({
                    resolve: success,
                    reject: failure,
                    callback:onFulfilled
                });
            }else{
                sucessQueue.push({
                    next: success,
                    callback:false
                });
            }
            if(typeof onRejected === 'function'){
                failureQueue.push({
                    resolve: success,
                    reject: failure,
                    callback:onRejected
                });
            }else{
                failureQueue.push({
                    next: failure,
                    callback:false
                });
            }
        });
    }
    this.then = function(onFulfilled, onRejected) {
        return resolved?resolved(onFulfilled, onRejected):pending(onFulfilled, onRejected);
    };
    // Case 2) handle a .resolve or .reject call
        // (`onFulfilled` acts as a sentinel)
        // The actual function signature is
        // .re[ject|solve](sentinel, success, value)
    function resolve(success, value){
        if(resolved){
            return;
        }
        resolved = createHandler(this, value, success?0:1);
        var queue = success ? sucessQueue : failureQueue;
        var len = queue.length;
        var i = -1;
        while(++i < len) {
            if (queue[i].callback) {
                immediate(execute,queue[i].callback, value, queue[i].resolve, queue[i].reject);
            }else if(queue[i].next){
                queue[i].next(value);
            }
        }
        // Replace this handler with a simple resolved or rejected handler
    }
    var fulfill = resolve.bind(this,true);
    var reject = resolve.bind(this,false);
    try{
        resolver(function(a){
            if(a && typeof a.then==='function'){
                a.then(fulfill,reject);
            }else{
                fulfill(a);
            }
        },reject);
    }catch(e){
        reject(e);
    }
}

// Creates a fulfilled or rejected .then function
function createHandler(scope, value, success) {
    return function() {
        var callback = arguments[success];
        if (typeof callback !== 'function') {
            return scope;
        }
        return Promise(function(resolve,reject){
            immediate(execute,callback,value,resolve,reject);
       });
    };
}

// Executes the callback with the specified value,
// resolving or rejecting the deferred
function execute(callback, value, resolve, reject) {
        try {
            var result = callback(value);
            if (result && typeof result.then === 'function') {
                result.then(resolve, reject);
            }
            else {
                resolve(result);
            }
        }
        catch (error) {
            reject(error);
        }
}
module.exports = Promise;

},{"immediate":38}],37:[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};module.exports = typeof global === "object" && global ? global : this;
},{}],38:[function(require,module,exports){
"use strict";
var types = [
    require("./nextTick"),
    require("./mutation"),
    require("./realSetImmediate"),
    require("./postMessage"),
    require("./messageChannel"),
    require("./stateChange"),
    require("./timeout")
];
var handlerQueue = [];

function drainQueue() {
    var i = 0,
        task,
        innerQueue = handlerQueue;
	handlerQueue = [];
	/*jslint boss: true */
	while (task = innerQueue[i++]) {
		task();
	}
}
var nextTick;
types.some(function (obj) {
    var t = obj.test();
    if (t) {
        nextTick = obj.install(drainQueue);
    }
    return t;
});
var retFunc = function (task) {
    var len, args;
    if (arguments.length > 1 && typeof task === "function") {
        args = Array.prototype.slice.call(arguments, 1);
        args.unshift(undefined);
        task = task.bind.apply(task, args);
    }
    if ((len = handlerQueue.push(task)) === 1) {
        nextTick(drainQueue);
    }
    return len;
};
retFunc.clear = function (n) {
    if (n <= handlerQueue.length) {
        handlerQueue[n - 1] = function () {};
    }
    return this;
};
module.exports = retFunc;

},{"./messageChannel":39,"./mutation":40,"./nextTick":41,"./postMessage":42,"./realSetImmediate":43,"./stateChange":44,"./timeout":45}],39:[function(require,module,exports){
"use strict";
var globe = require("./global");
exports.test = function () {
    return !!globe.MessageChannel;
};

exports.install = function (func) {
    var channel = new globe.MessageChannel();
    channel.port1.onmessage = func;
    return function () {
        channel.port2.postMessage(0);
    };
};
},{"./global":37}],40:[function(require,module,exports){
"use strict";
//based off rsvp
//https://github.com/tildeio/rsvp.js/blob/master/lib/rsvp/async.js
var globe = require("./global");

var MutationObserver = globe.MutationObserver || globe.WebKitMutationObserver;

exports.test = function () {
    return MutationObserver;
};

exports.install = function (handle) {
    var observer = new MutationObserver(handle);
    var element = globe.document.createElement("div");
    observer.observe(element, { attributes: true });

    // Chrome Memory Leak: https://bugs.webkit.org/show_bug.cgi?id=93661
    globe.addEventListener("unload", function () {
        observer.disconnect();
        observer = null;
    }, false);
    return function () {
        element.setAttribute("drainQueue", "drainQueue");
    };
};
},{"./global":37}],41:[function(require,module,exports){
var process=require("__browserify_process");"use strict";
exports.test = function () {
    // Don't get fooled by e.g. browserify environments.
    return typeof process === "object" && Object.prototype.toString.call(process) === "[object process]";
};

exports.install = function () {
    return process.nextTick;
};
},{"__browserify_process":2}],42:[function(require,module,exports){
"use strict";
var globe = require("./global");
exports.test = function () {
    // The test against `importScripts` prevents this implementation from being installed inside a web worker,
    // where `global.postMessage` means something completely different and can"t be used for this purpose.

    if (!globe.postMessage || globe.importScripts) {
        return false;
    }

    var postMessageIsAsynchronous = true;
    var oldOnMessage = globe.onmessage;
    globe.onmessage = function () {
        postMessageIsAsynchronous = false;
    };
    globe.postMessage("", "*");
    globe.onmessage = oldOnMessage;

    return postMessageIsAsynchronous;
};

exports.install = function (func) {
    var codeWord = "com.calvinmetcalf.setImmediate" + Math.random();
    function globalMessage(event) {
        if (event.source === globe && event.data === codeWord) {
            func();
        }
    }
    if (globe.addEventListener) {
        globe.addEventListener("message", globalMessage, false);
    } else {
        globe.attachEvent("onmessage", globalMessage);
    }
    return function () {
        globe.postMessage(codeWord, "*");
    };
};
},{"./global":37}],43:[function(require,module,exports){
"use strict";
var globe = require("./global");
exports.test = function () {
    return  globe.setImmediate;
};

exports.install = function (handle) {
    //return globe.setImmediate.bind(globe, handle);
    return globe.setTimeout.bind(globe,handle,0);
};

},{"./global":37}],44:[function(require,module,exports){
"use strict";
var globe = require("./global");
exports.test = function () {
    return "document" in globe && "onreadystatechange" in globe.document.createElement("script");
};

exports.install = function (handle) {
    return function () {

        // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
        // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
        var scriptEl = globe.document.createElement("script");
        scriptEl.onreadystatechange = function () {
            handle();

            scriptEl.onreadystatechange = null;
            scriptEl.parentNode.removeChild(scriptEl);
            scriptEl = null;
        };
        globe.document.documentElement.appendChild(scriptEl);

        return handle;
    };
};
},{"./global":37}],45:[function(require,module,exports){
"use strict";
exports.test = function () {
    return true;
};

exports.install = function (t) {
    return function () {
        setTimeout(t, 0);
    };
};
},{}]},{},[1])
(1)
});
;