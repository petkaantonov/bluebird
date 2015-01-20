"use strict";
var ASSERT = require("./assert.js");
var schedule = require("./schedule.js");
var Queue = require("./queue.js");
var errorObj = require("./util.js").errorObj;
var tryCatch1 = require("./util.js").tryCatch1;

function Async() {
    this._isTickUsed = false;
    this._length = 0;
    // The initial capacities were manually determined.
    // I ran HBO GO under stressful conditions and looked at how large they grew.
    // It should be a better estimate than stock-bluebird (which underestimated
    // _lateBuffer and overestimated _functionBuffer), which will save us memory,
    // GC overhead, and resize cost.
    //
    // If another project wants initial capacity to be different we will need to
    // introduce some sort of configuration here.
    this._lateBuffer = new Queue(16384);
    this._functionBuffer = new Queue(2048);
    var self = this;
    //Optimized around the fact that no arguments
    //need to be passed
    this.consumeFunctionBuffer = function Async$consumeFunctionBuffer() {
        self._consumeFunctionBuffer();
    };
    this.externalDispatcher = undefined;
}

Async.prototype.haveItemsQueued = function Async$haveItemsQueued() {
    return this._length > 0;
};

//When the fn absolutely needs to be called after
//the queue has been completely flushed
Async.prototype.invokeLater = function Async$invokeLater(fn, receiver, arg) {
    ASSERT(typeof fn === "function");
    ASSERT(arguments.length === 3);
    this._lateBuffer.push(fn, receiver, arg);
    this._queueTick();
};

Async.prototype.invoke = function Async$invoke(fn, receiver, arg) {
    ASSERT(typeof fn === "function");
    ASSERT(arguments.length === 3);
    var functionBuffer = this._functionBuffer;
    functionBuffer.push(fn, receiver, arg);
    this._length = functionBuffer.length();
    this._queueTick();
};

Async.prototype._consumeFunctionBuffer =
function Async$_consumeFunctionBuffer() {
    var functionBuffer = this._functionBuffer;
    ASSERT(this._isTickUsed);
    while(functionBuffer.length() > 0) {
        var fn = functionBuffer.shift();
        var receiver = functionBuffer.shift();
        var arg = functionBuffer.shift();
        fn.call(receiver, arg);
    }
    this._reset();
    this._consumeLateBuffer();
};

Async.prototype._consumeLateBuffer = function Async$_consumeLateBuffer() {
    var buffer = this._lateBuffer;
    while(buffer.length() > 0) {
        var fn = buffer.shift();
        var receiver = buffer.shift();
        var arg = buffer.shift();
        var res = tryCatch1(fn, receiver, arg);
        if (res === errorObj) {
            this._queueTick();
            throw res.e;
        }
    }
};

Async.prototype._queueTick = function Async$_queue() {
    if (!this._isTickUsed) {
        if (this.externalDispatcher !== undefined) {
            this.externalDispatcher.queueCallback(this.consumeFunctionBuffer);
        } else {
            schedule(this.consumeFunctionBuffer);
        }
        this._isTickUsed = true;
    }
};

Async.prototype._reset = function Async$_reset() {
    this._isTickUsed = false;
    this._length = 0;
};

module.exports = new Async();
