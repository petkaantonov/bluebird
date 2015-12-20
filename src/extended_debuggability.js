module.exports = function(Promise) {
var util = require("./util");
var es5 = require("./es5");

util.hookTo(Promise, "config", function (opts) {
    if ("monitor" in opts) {
        if (opts.monitor) {
            enableMonitoring();
        } else {
            disableMonitoring();
        }
    }
    if ("tracing" in opts) {
        if (opts.tracing) {
            enableTracing();
        } else {
            disableTracing();
        }
    }
    if ("maxChainLength" in opts) {
        if (opts.maxChainLength) {
            if (typeof opts.maxChainLength === "number") {
                enableChainLengthLimit(opts.maxChainLength);
            } else {
                enableChainLengthLimit(100000);
            }
        } else {
            disableChainLengthLimit();
        }
    }
    if ("maxPendingPromises" in opts) {
        if (opts.maxPendingPromises) {
            if (typeof opts.maxPendingPromises === "number") {
                enableMaxPendingPromises(opts.maxPendingPromises);
            } else {
                enableMaxPendingPromises(100000);
            }
        } else {
            disableMaxPendingPromises();
        }
    }
});

// Promise monitoring
var pendingPromises = {};
var promiseIdCounter = 0;

function registerPromise() {
    if (Promise.monitor) {
        promiseIdCounter++;
        this._promiseId = promiseIdCounter;
        pendingPromises[promiseIdCounter] = this;
    }
}

function unregisterPromise() {
    if (Promise.monitor)
        delete pendingPromises[this._promiseId];
}

function enableMonitoring() {
    if (!Promise.monitor) {
        // Property that holds monitoring related info,
        // existence of it means that monitoring feature is currently enabled
        Promise.monitor = {};

        util.hookTo(Promise.prototype, "_hook_created", registerPromise);
        util.hookTo(Promise.prototype, "_hook_fulfilled", unregisterPromise);
        util.hookTo(Promise.prototype, "_hook_rejected", unregisterPromise);
        util.hookTo(Promise.prototype, "_hook_following", unregisterPromise);
        util.hookTo(Promise.prototype, "_hook_cancelled", unregisterPromise);

        Promise.monitor.getPendingPromises = function () {
            var result = [];
            var keys = es5.keys(pendingPromises);
            for (var i = 0; i < keys.length; i++) {
                result.push(pendingPromises[keys[i]]);
            }
            return result;
        };

        Promise.monitor.getLeafPendingPromises = function () {
            var pendingPromises = Promise.monitor.getPendingPromises();
            var leafPromises = [];
            for (var i = 0; i < pendingPromises.length; i++) {
                var currentPromise = pendingPromises[i];
                if (typeof currentPromise._promise0 === "undefined" &&
                    typeof currentPromise._receiver0 === "undefined") {
                    leafPromises.push(currentPromise);
                }
            }
            return leafPromises;
        };
    }
}

function disableMonitoring() {
    if (Promise.monitor) {
        // No reason to clean up the id's from pending promises
        util.unhookFrom(Promise.prototype, "_hook_created",
            registerPromise);
        util.unhookFrom(Promise.prototype, "_hook_fulfilled",
            unregisterPromise);
        util.unhookFrom(Promise.prototype, "_hook_rejected",
            unregisterPromise);
        util.unhookFrom(Promise.prototype, "_hook_following",
            unregisterPromise);
        util.unhookFrom(Promise.prototype, "_hook_cancelled",
            unregisterPromise);
        Promise.monitor = null;
        pendingPromises = null;
    }
}

// Chain length limit
var chainLengthLimit = null;
var chainLengthLimitHandler = function() {
    throw new Error("Promises chain is too long, it reached " +
        "limit of " + chainLengthLimit + " promises");
};

function incrementChainLength (next) {
    if (typeof this._chainLength === "undefined") this._chainLength = 0;
    next._chainLength = this._chainLength + 1;
    if (next._chainLength > chainLengthLimit) {
        chainLengthLimitHandler();
    }
}

function enableChainLengthLimit(limit) {
    if (!chainLengthLimit) {
        chainLengthLimit = limit;
        util.hookTo(Promise.prototype, "_hook_chained", incrementChainLength);
        Promise.onChainLengthLimitExceeded =
            function (fn) {chainLengthLimitHandler = fn;};
    }
}

function disableChainLengthLimit() {
    if (chainLengthLimit) {
        chainLengthLimit = null;
        util.unhookFrom(Promise.prototype, "_hook_chained",
            incrementChainLength);
    }
}

// Pending promises limit
var pendingPromisesLimit = null;
var pendingPromisesNumber = 0;
var exceptionPendingPromisesLimitHandler = function() {
    throw new Error("Too many pending promises, it reached limit" +
        " of " + pendingPromisesLimit + " promises");
};
var pendingPromisesLimitHandler = exceptionPendingPromisesLimitHandler;

function incrementPending() {
    if (pendingPromisesLimit > 0) {
        pendingPromisesNumber++;
        if (pendingPromisesNumber > pendingPromisesLimit) {
            pendingPromisesLimitHandler();
        }
    }
}

function decrementPending() {
    if (pendingPromisesLimit)
        pendingPromisesNumber--;
}

function enableMaxPendingPromises(limit) {
    if (pendingPromisesLimit) return;
    pendingPromisesLimit = limit;
    util.hookTo(Promise.prototype, "_hook_created", incrementPending);
    util.hookTo(Promise.prototype, "_hook_fulfilled", decrementPending);
    util.hookTo(Promise.prototype, "_hook_rejected", decrementPending);
    util.hookTo(Promise.prototype, "_hook_following", decrementPending);
    util.hookTo(Promise.prototype, "_hook_cancelled", decrementPending);
    Promise.onPendingPromisesLimitExceeded =
            function (fn) {pendingPromisesLimitHandler = fn;};
}

function disableMaxPendingPromises() {
    if (!pendingPromisesLimit) return;
    pendingPromisesLimit = null;
    pendingPromisesNumber = 0;
    pendingPromisesLimitHandler = exceptionPendingPromisesLimitHandler;
    util.unhookFrom(Promise.prototype, "_hook_created", incrementPending);
    util.unhookFrom(Promise.prototype, "_hook_fulfilled", decrementPending);
    util.unhookFrom(Promise.prototype, "_hook_rejected", decrementPending);
    util.unhookFrom(Promise.prototype, "_hook_following", decrementPending);
    util.unhookFrom(Promise.prototype, "_hook_cancelled", decrementPending);
}

// Promises tracing
var tracingEnabled = false;
var promiseTraceIdCounter = 0;

function addTracingInfo (next) {
    if (!this._promiseId) {
        promiseTraceIdCounter++;
        this._promiseId = promiseTraceIdCounter;
    }
    if (!this._tracks) this._tracks = [];
    if (!next._trackedBy) this._trackedBy = [];
    this._tracks.push(next);
    next._trackedBy.push(this);
}

// Recursive depth of this function is limited so it would produce
// human-readable input and would not care about circles
function getDOTGraph (depth, destination) {
    var result = [];
    depth++;
    if (depth > 1000) {
        return;
    }

    var nodeName = null;
    if (this._trace && this._trace.stack) {
        var firstLine = this._trace.stack.split("\n")[1].trim();
        var functionNameAndLocation = /at (.*) \(.*\/(.*:.*:.*)\)/g;
        var match = functionNameAndLocation.exec(firstLine);
        if (match.length !== 2) {
            throw new Error(
                "Failed parsing function name from stack trace");
        }
        nodeName = match[1] + " at " + match[2];
    } else {
        nodeName = this._promiseId;
    }

    result.push(this._promiseId + "[label=\"" + nodeName + "\"" +
    this.inspect().state !== "fulfilled" ? ",color=red" : "" + "];");

    if (this._tracks && (typeof destination === "undefined" ||
        destination === true)) {
        var tracksLength =
            this._tracks.length > 1000 ? 1000 : this._tracks.length;
        for (var i = 0; i < tracksLength; i++) {
            result.push(
                this._promiseId + "->" + this._tracks[i]._promiseId + ";");
            result.concat(this._tracks[i].getDOTGraph(depth, true));
        }
    }
    if (this._trackedBy && (typeof destination === "undefined" ||
        destination === false)) {
        var trackedByLength =
            this._trackedBy.length > 1000 ? 1000 : this._trackedBy.length;
        for (var i = 0; i < trackedByLength; i++) {
            result.push(
                this._tracks[i]._promiseId + "->" + this._promiseId + ";");
            result.concat(this._tracks[i].getDOTGraph(depth, false));
        }
    }
    return typeof destination === "undefined" ? result.toString() : result;
}

function findWaitingFor (){
    if (!this.isPending()) {
        throw new Error("This promise is not waiting "+
            "for any other promise");
    }
    if (!this._tracks) {
        throw new Error("Tracing data is missing, " +
            "tracing the last pending promises in chain is not possible");
    }
    if (this._tracks.length > 0) {
        var foundWaitingFor = [];
        for (var i = 0; i < this._tracks.length; i++) {
            if (this.isPending()) {
                foundWaitingFor = foundWaitingFor.concat(
                    this._tracks[i].findWaitingFor());
            }
        }
        return;
    } else {
        return [this];
    }
}

function findRejectionReason () {
    if (!this.isRejected()) {
        throw new Error("This promise was not rejected");
    }
    if (!this._tracks) {
        throw new Error("Tracing data is missing, "+
            "tracing the reason is not possible");
    }
    for (var i = 0; i < this._tracks.length; i++) {
        return this._tracks[i].findReason();
    }
    return this;
}

function enableTracing() {
    if (!chainLengthLimit) {
        tracingEnabled = true;
        util.hookTo(Promise.prototype, "_hook_chained", addTracingInfo);
        Promise.prototype.findRejectionReason = findRejectionReason;
        Promise.prototype.findWaitingFor = findWaitingFor;
        Promise.prototype.getDOTGraph = getDOTGraph;
    }
}

function disableTracing() {
    if (chainLengthLimit) {
        tracingEnabled = false;
        promiseTraceIdCounter = 0;
        util.unhookFrom(Promise.prototype, "_hook_chained", addTracingInfo);
        Promise.prototype.findRejectionReason = null;
        Promise.prototype.findWaitingFor = null;
        Promise.prototype.getDOTGraph = null;
    }
}
};
