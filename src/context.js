"use strict";
module.exports = function(Promise) {

var util = require("./util");
var longStackTraces = false;
var contextStack = [];

util.hookTo(Promise.prototype, "_hook_created", null);
util.hookTo(Promise.prototype, "_hook_fulfilled", null);
util.hookTo(Promise.prototype, "_hook_rejected", null);
util.hookTo(Promise.prototype, "_hook_following", null);
util.hookTo(Promise.prototype, "_hook_cancelled", null);
util.hookTo(Promise.prototype, "_hook_chained", null);

util.hookTo(Promise.prototype, "_pushContext", null);
Promise.prototype._popContext = function() {return null;};
Promise._peekContext = Promise.prototype._peekContext = function() {};

function Context() {
    this._trace = new Context.CapturedTrace(peekContext());
}
Context.prototype._pushContext = function () {
    if (this._trace !== undefined) {
        this._trace._promiseCreated = null;
        contextStack.push(this._trace);
    }
};

Context.prototype._popContext = function () {
    if (this._trace !== undefined) {
        var trace = contextStack.pop();
        var ret = trace._promiseCreated;
        trace._promiseCreated = null;
        return ret;
    }
    return null;
};

function createContext() {
    if (longStackTraces) return new Context();
}

function peekContext() {
    var lastIndex = contextStack.length - 1;
    if (lastIndex >= 0) {
        return contextStack[lastIndex];
    }
    return undefined;
}
Context.CapturedTrace = null;
Context.create = createContext;
Context.deactivateLongStackTraces = function() {};
Context.activateLongStackTraces = function() {
    var Promise_popContext = Promise.prototype._popContext;
    var Promise_PeekContext = Promise._peekContext;
    var Promise_peekContext = Promise.prototype._peekContext;
    var longStackTracesPromiseCreatedHookExtension = function() {
        var ctx = this._peekContext();
        if (ctx && ctx._promiseCreated == null) ctx._promiseCreated = this;
    };
    Context.deactivateLongStackTraces = function() {
        util.unhookFrom(Promise.prototype, "_pushContext",
            Context.prototype._pushContext);
        util.unhookFrom(Promise.prototype, "_hook_created",
            longStackTracesPromiseCreatedHookExtension);
        Promise.prototype._popContext = Promise_popContext;
        Promise._peekContext = Promise_PeekContext;
        Promise.prototype._peekContext = Promise_peekContext;
        longStackTraces = false;
    };
    longStackTraces = true;
    util.hookTo(Promise.prototype, "_pushContext",
        Context.prototype._pushContext);
    util.hookTo(Promise.prototype, "_hook_created",
        longStackTracesPromiseCreatedHookExtension);
    Promise.prototype._popContext = Context.prototype._popContext;
    Promise._peekContext = Promise.prototype._peekContext = peekContext;
};
return Context;
};
