"use strict";
module.exports = function(Promise, CapturedTrace, longStackTraces) {
var contextStack = [];
function Context() {
    this._trace = new CapturedTrace(peekContext());
}
Context.prototype._pushContext = function () {
    if (!longStackTraces()) return;
    if (this._trace !== undefined) {
        this._trace._promisesCreated = 0;
        contextStack.push(this._trace);
    }
};

Context.prototype._popContext = function () {
    if (!longStackTraces()) return 0;
    if (this._trace !== undefined) {
        var trace = contextStack.pop();
        var ret = trace._promisesCreated;
        trace._promisesCreated = 0;
        return ret;
    }
    return 0;
};

function createContext() {
    if (longStackTraces()) return new Context();
}

function peekContext() {
    var lastIndex = contextStack.length - 1;
    if (lastIndex >= 0) {
        return contextStack[lastIndex];
    }
    return undefined;
}

Promise.prototype._peekContext = peekContext;
Promise.prototype._pushContext = Context.prototype._pushContext;
Promise.prototype._popContext = Context.prototype._popContext;

return createContext;
};
