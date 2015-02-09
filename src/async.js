"use strict";
var firstLineError;
try {throw new Error(); } catch (e) {firstLineError = e;}
var ASSERT = require("./assert.js");
var schedule = require("./schedule.js");
var Queue = require("./queue.js");

function Async() {
    this._isTickUsed = false;
    this._lateQueue = new Queue(LATE_QUEUE_CAPACITY);
    this._normalQueue = new Queue(NORMAL_QUEUE_CAPACITY);
    var self = this;
    this.drainQueues = function () {
        self._drainQueues();
    };
    this._schedule =
        schedule.isStatic ? schedule(this.drainQueues) : schedule;
}

Async.prototype.haveItemsQueued = function () {
    return this._normalQueue.length() > 0;
};

Async.prototype.fatalError = function(e, trace, isNode) {
    var stack = trace !== undefined && trace !== e ? trace.stack : e.stack;
    if (isNode) {
        process.stderr.write("Fatal " + stack);
        process.exit(2);
    } else {
        this.throwLater(e);
    }
};

// Must be used if fn can throw
Async.prototype.throwLater = function(fn, arg) {
    if (arguments.length === 1) {
        arg = fn;
        fn = function () { throw arg; };
    }
    if (typeof setTimeout !== "undefined") {
        setTimeout(function() {
            fn(arg);
        }, 0);
    } else try {
        this._schedule(function() {
            fn(arg);
        });
    } catch (e) {
        throw new Error(NO_ASYNC_SCHEDULER);
    }
};

//When the fn absolutely needs to be called after
//the queue has been completely flushed
Async.prototype.invokeLater = function (fn, receiver, arg) {
    ASSERT(arguments.length === 3);
    this._lateQueue.push(fn, receiver, arg);
    this._queueTick();
};

Async.prototype.invokeFirst = function (fn, receiver, arg) {
    ASSERT(arguments.length === 3);
    this._normalQueue.unshift(fn, receiver, arg);
    this._queueTick();
};

Async.prototype.invoke = function (fn, receiver, arg) {
    ASSERT(arguments.length === 3);
    this._normalQueue.push(fn, receiver, arg);
    this._queueTick();
};

Async.prototype.settlePromises = function(promise) {
    this._normalQueue._pushOne(promise);
    this._queueTick();
};

Async.prototype._drainQueue = function(queue) {
    while (queue.length() > 0) {
        var fn = queue.shift();
        if (typeof fn !== "function") {
            fn._settlePromises();
            continue;
        }
        var receiver = queue.shift();
        var arg = queue.shift();
        fn.call(receiver, arg);
    }
};

Async.prototype._drainQueues = function () {
    ASSERT(this._isTickUsed);
    this._drainQueue(this._normalQueue);
    this._reset();
    this._drainQueue(this._lateQueue);
};

Async.prototype._queueTick = function () {
    if (!this._isTickUsed) {
        this._isTickUsed = true;
        this._schedule(this.drainQueues);
    }
};

Async.prototype._reset = function () {
    this._isTickUsed = false;
};

module.exports = new Async();
module.exports.firstLineError = firstLineError;
