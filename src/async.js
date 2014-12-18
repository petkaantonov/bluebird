"use strict";
var firstLineError = new Error();
var ASSERT = require("./assert.js");
var schedule = require("./schedule.js");
var Queue = require("./queue.js");
var errorObj = require("./util.js").errorObj;
var tryCatch1 = require("./util.js").tryCatch1;
var _process = typeof process !== "undefined" ? process : undefined;

function Async() {
    this._isTickUsed = false;
    this._schedule = schedule;
    this._lateBuffer = new Queue(LATE_BUFFER_CAPACITY);
    this._functionBuffer = new Queue(FUNCTION_BUFFER_CAPACITY);
    var self = this;
    //Optimized around the fact that no arguments
    //need to be passed
    this.consumeFunctionBuffer = function () {
        self._consumeFunctionBuffer();
    };
}

Async.prototype.haveItemsQueued = function () {
    return this._functionBuffer.length() > 0;
};

//When the fn absolutely needs to be called after
//the queue has been completely flushed
Async.prototype.invokeLater = function (fn, receiver, arg) {
    ASSERT(typeof fn === "function");
    ASSERT(arguments.length === 3);
    if (_process !== undefined &&
        _process.domain != null &&
        !fn.domain) {
        fn = _process.domain.bind(fn);
    }
    this._lateBuffer.push(fn, receiver, arg);
    this._queueTick();
};

Async.prototype._withDomain = function(fn) {
    ASSERT(typeof fn === "function");
    if (_process !== undefined &&
        _process.domain != null &&
        !fn.domain) {
        fn = _process.domain.bind(fn);
    }
    return fn;
};

Async.prototype.invokeFirst = function (fn, receiver, arg) {
    ASSERT(arguments.length === 3);
    fn = this._withDomain(fn);
    this._functionBuffer.unshift(fn, receiver, arg);
    this._queueTick();
};

Async.prototype.invoke = function (fn, receiver, arg) {
    ASSERT(arguments.length === 3);
    fn = this._withDomain(fn);
    this._functionBuffer.push(fn, receiver, arg);
    this._queueTick();
};

Async.prototype._consumeFunctionBuffer = function () {
    var functionBuffer = this._functionBuffer;
    ASSERT(this._isTickUsed);
    while (functionBuffer.length() > 0) {
        var fn = functionBuffer.shift();
        var receiver = functionBuffer.shift();
        var arg = functionBuffer.shift();
        fn.call(receiver, arg);
    }
    this._reset();
    this._consumeLateBuffer();
};

Async.prototype._consumeLateBuffer = function () {
    var buffer = this._lateBuffer;
    while(buffer.length() > 0) {
        var fn = buffer.shift();
        var receiver = buffer.shift();
        var arg = buffer.shift();
        var res = tryCatch1(fn, receiver, arg);
        if (res === errorObj) {
            this._queueTick();
            if (fn.domain != null) {
                fn.domain.emit("error", res.e);
            } else {
                throw res.e;
            }
        }
    }
};

Async.prototype._queueTick = function () {
    if (!this._isTickUsed) {
        this._schedule(this.consumeFunctionBuffer);
        this._isTickUsed = true;
    }
};

Async.prototype._reset = function () {
    this._isTickUsed = false;
};

module.exports = new Async();
module.exports.firstLineError = firstLineError;
