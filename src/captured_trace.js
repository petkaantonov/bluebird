"use strict";
module.exports = function() {
var async = require("./async.js");
var ASSERT = require("./assert.js");
var inherits = require("./util.js").inherits;
var bluebirdFramePattern = /[\\\/]bluebird[\\\/]js[\\\/](main|debug|zalgo)/;
var stackFramePattern = null;
var formatStack = null;

function CapturedTrace(parent) {
    ASSERT(parent === undefined || parent instanceof CapturedTrace);
    this._parent = parent;
    var length = this._length = 1 + (parent === undefined ? 0 : parent._length);
    captureStackTrace(this, CapturedTrace);
    // Unless the user manually nested > 32 indentation levels,
    // there must be cycles
    if (length > 32) this.uncycle();
}
inherits(CapturedTrace, Error);

CapturedTrace.prototype.uncycle = function() {
    var length = this._length;
    if (length < 2) return;
    var nodes = [];
    var stackToIndex = {};

    for (var i = 0, node = this; node !== undefined; ++i) {
        nodes.push(node);
        node = node._parent;
    }
    // the node length is only used as heuristic to decide when to decycle, as
    // there may be multiple linked lists that share members and decycling one
    // will fail to update lenghts in the other. This is the correct length.
    length = this._length = i;
    ASSERT(nodes[0] === this);
    ASSERT(nodes[nodes.length - 1] instanceof CapturedTrace);

    for (var i = length - 1; i >= 0; --i) {
        var stack = nodes[i].stack;
        if (stackToIndex[stack] === undefined) {
            stackToIndex[stack] = i;
        }
    }
    for (var i = 0; i < length; ++i) {
        var currentStack = nodes[i].stack;
        var index = stackToIndex[currentStack];
        ASSERT(currentStack === nodes[index].stack);

        if (index !== undefined && index !== i) {
            if (index > 0) {
                ASSERT(nodes[index - 1]._parent === nodes[index]);
                nodes[index - 1]._parent = undefined;
                nodes[index - 1]._length = 1;
            }
            nodes[i]._parent = undefined;
            nodes[i]._length = 1;
            var cycleEdgeNode = i > 0 ? nodes[i - 1] : this;

            if (index < length - 1) {
                cycleEdgeNode._parent = nodes[index + 1];
                cycleEdgeNode._parent.uncycle();
                cycleEdgeNode._length =
                    cycleEdgeNode._parent._length + 1;
            } else {
                cycleEdgeNode._parent = undefined;
                cycleEdgeNode._length = 1;
            }
            var currentChildLength = cycleEdgeNode._length + 1;
            for (var j = i - 2; j >= 0; --j) {
                nodes[j]._length = currentChildLength;
                currentChildLength++;
            }
            return;
        }
    }
};

CapturedTrace.prototype.parent = function() {
    return this._parent;
};

CapturedTrace.prototype.hasParent = function() {
    return this._parent !== undefined;
};

CapturedTrace.prototype.attachExtraTrace = function(error) {
    if (error.__stackCleaned__) return;
    this.uncycle();
    var trace = this;
    var stack = CapturedTrace.cleanStack(error, false);
    var headerLineCount = 1;
    var combinedTraces = 1;
    do {
        stack = trace.combine(stack);
        combinedTraces++;
    } while ((trace = trace.parent()) != null);

    stack = unProtectNewlines(stack);

    if (stack.length <= headerLineCount) {
        error.stack = "(No stack trace)";
    } else {
        error.stack = stack.join("\n");
    }
};

CapturedTrace.prototype.combine = function(current) {
    var prev = clean(this.stack.split("\n"), 0);
    var currentLastIndex = current.length - 1;
    var currentLastLine = current[currentLastIndex];
    var commonRootMeetPoint = -1;
    //Eliminate common roots
    for (var i = prev.length - 1; i >= 0; --i) {
        if (prev[i] === currentLastLine) {
            commonRootMeetPoint = i;
            break;
        }
    }

    for (var i = commonRootMeetPoint; i >= 0; --i) {
        var line = prev[i];
        if (current[currentLastIndex] === line) {
            current.pop();
            currentLastIndex--;
        } else {
            break;
        }
    }

    if (current[current.length - 1] !== FROM_PREVIOUS_EVENT) {
        current.push(FROM_PREVIOUS_EVENT);
    }
    return current.concat(prev);
};

function protectErrorMessageNewlines (stack) {
    for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        if (NO_STACK_TRACE === line || stackFramePattern.test(line)) {
            break;
        }
    }

    // No multiline error message
    if (i <= 1) return 1;

    var errorMessageLines = [];
    for (var j = 0; j < i; ++j) {
        errorMessageLines.push(stack.shift());
    }
    stack.unshift(errorMessageLines.join(NEWLINE_PROTECTOR));
    return i;
}

function unProtectNewlines(stack) {
    if (stack.length > 0) {
        stack[0] = stack[0].split(NEWLINE_PROTECTOR).join("\n");
        if (stack[stack.length - 1] === FROM_PREVIOUS_EVENT) {
            stack.pop();
        }
    }
    return stack;
}

function clean(stack, initialIndex) {
    ASSERT(initialIndex >= 0);
    var ret = stack.slice(0, initialIndex);
    for (var i = initialIndex; i < stack.length; ++i) {
        var line = stack[i];
        var isTraceLine = stackFramePattern.test(line) ||
            NO_STACK_TRACE === line;
        var isInternalFrame = isTraceLine && shouldIgnore(line);
        if (isTraceLine && !isInternalFrame) {
            ret.push(line);
        }
    }
    return ret;
}

CapturedTrace.cleanStack = function(error, shouldUnProtectNewlines) {
    if (error.__stackCleaned__) return;
    error.__stackCleaned__ = true;
    var stack = error.stack;
    stack = typeof stack === "string"
        ? stack.split("\n")
        : [error.toString(), NO_STACK_TRACE];
    var initialIndex = protectErrorMessageNewlines(stack);
    stack = clean(stack, initialIndex);
    if (shouldUnProtectNewlines) stack = unProtectNewlines(stack);
    error.stack = stack.join("\n");
    return stack;
};

CapturedTrace.formatAndLogError = function(error, title) {
    if (typeof console === "object") {
        var message;
        if (typeof error === "object" || typeof error === "function") {
            var stack = error.stack;
            message = title + formatStack(stack, error);
        } else {
            message = title + String(error);
        }
        if (typeof console.warn === "function" ||
            typeof console.warn === "object") {
            console.warn(message);
        } else if (typeof console.log === "function" ||
            typeof console.log === "object") {
            console.log(message);
        }
    }
};

CapturedTrace.unhandledRejection = function (reason) {
    CapturedTrace.formatAndLogError(
        reason, "^--- With additional stack trace: ");
};

CapturedTrace.isSupported = function () {
    return typeof captureStackTrace === "function";
};

CapturedTrace.fireRejectionEvent =
function(name, localHandler, reason, promise) {
    var localEventFired = false;
    try {
        if (typeof localHandler === "function") {
            localEventFired = true;
            if (name === REJECTION_HANDLED_EVENT) {
                localHandler(promise);
            } else {
                localHandler(reason, promise);
            }
        }
    } catch (e) {
        async.throwLater(e);
    }

    var globalEventFired = false;
    try {
        globalEventFired = fireGlobalEvent(name, reason, promise);
    } catch (e) {
        globalEventFired = true;
        async.throwLater(e);
    }

    if (!globalEventFired && !localEventFired &&
        name === UNHANDLED_REJECTION_EVENT) {
        CapturedTrace.formatAndLogError(reason, UNHANDLED_REJECTION_HEADER);
    }
};

function formatNonError(obj) {
    var str;
    if (typeof obj === "function") {
        str = "[function " +
            (obj.name || "anonymous") +
            "]";
    } else {
        str = obj.toString();
        var ruselessToString = /\[object [a-zA-Z0-9$_]+\]/;
        if (ruselessToString.test(str)) {
            try {
                var newStr = JSON.stringify(obj);
                str = newStr;
            }
            catch(e) {

            }
        }
        if (str.length === 0) {
            str = "(empty array)";
        }
    }
    return ("(<" + snip(str) + ">, no stack trace)");
}

function snip(str) {
    var maxChars = 41;
    if (str.length < maxChars) {
        return str;
    }
    return str.substr(0, maxChars - 3) + "...";
}

// For filtering out internal calls from stack traces
var shouldIgnore = function() { return false; };
var parseLineInfoRegex = /[\/<\(]([^:\/]+):(\d+):(?:\d+)\)?\s*$/;
function parseLineInfo(line) {
    var matches = line.match(parseLineInfoRegex);
    if (matches) {
        return {
            fileName: matches[1],
            line: parseInt(matches[2], 10)
        };
    }
}
CapturedTrace.setBounds = function(firstLineError, lastLineError) {
    if (!CapturedTrace.isSupported()) return;
    var firstStackLines = firstLineError.stack.split("\n");
    var lastStackLines = lastLineError.stack.split("\n");
    var firstIndex = -1;
    var lastIndex = -1;
    var firstFileName;
    var lastFileName;
    for (var i = 0; i < firstStackLines.length; ++i) {
        var result = parseLineInfo(firstStackLines[i]);
        if (result) {
            firstFileName = result.fileName;
            firstIndex = result.line;
            break;
        }
    }
    for (var i = 0; i < lastStackLines.length; ++i) {
        var result = parseLineInfo(lastStackLines[i]);
        if (result) {
            lastFileName = result.fileName;
            lastIndex = result.line;
            break;
        }
    }
    if (firstIndex < 0 || lastIndex < 0 || !firstFileName || !lastFileName ||
        firstFileName !== lastFileName || firstIndex >= lastIndex) {
        return;
    }

    shouldIgnore = function(line) {
        if (bluebirdFramePattern.test(line)) return true;
        var info = parseLineInfo(line);
        if (info) {
            if (info.fileName === firstFileName &&
                (firstIndex <= info.line && info.line <= lastIndex)) {
                return true;
            }
        }
        return false;
    };
};

var captureStackTrace = (function stackDetection() {
    var v8stackFramePattern = /^\s*at\s*/;
    var v8stackFormatter = function(stack, error) {
        ASSERT(error !== null);

        if (typeof stack === "string") return stack;

        if (error.name !== undefined &&
            error.message !== undefined) {
            return error.name + ". " + error.message;
        }
        return formatNonError(error);
    };

    //V8
    if (typeof Error.stackTraceLimit === "number" &&
        typeof Error.captureStackTrace === "function") {
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        var captureStackTrace = Error.captureStackTrace;

        // For node
        shouldIgnore = function(line) {
            return bluebirdFramePattern.test(line);
        };
        return function(receiver, ignoreUntil) {
            captureStackTrace(receiver, ignoreUntil);
        };
    }
    var err = new Error();

    //SpiderMonkey
    if (typeof err.stack === "string" &&
        typeof "".startsWith === "function" &&
        (err.stack.startsWith("stackDetection@")) &&
        stackDetection.name === "stackDetection") {

        stackFramePattern = /@/;
        var rline = /[@\n]/;

        formatStack = function(stack, error) {
            if (typeof stack === "string") {
                return (error.name + ". " + error.message + "\n" + stack);
            }

            if (error.name !== undefined &&
                error.message !== undefined) {
                return error.name + ". " + error.message;
            }
            return formatNonError(error);
        };

        return function captureStackTrace(o) {
            var stack = new Error().stack;
            var split = stack.split(rline);
            var len = split.length;
            var ret = "";
            for (var i = 0; i < len; i += 2) {
                ret += split[i];
                ret += "@";
                ret += split[i + 1];
                ret += "\n";
            }
            o.stack = ret;
        };
    }

    var hasStackAfterThrow;
    try { throw new Error(); }
    catch(e) {
        hasStackAfterThrow = ("stack" in e);
    }
    // IE
    if (!("stack" in err) && hasStackAfterThrow) {
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        return function captureStackTrace(o) {
            try { throw new Error(); }
            catch(e) { o.stack = e.stack; }
        };
    }

    formatStack = function(stack, error) {
        if (typeof stack === "string") return stack;

        if ((typeof error === "object" ||
            typeof error === "function") &&
            error.name !== undefined &&
            error.message !== undefined) {
            return error.name + ". " + error.message;
        }
        return formatNonError(error);
    };

    return null;

})();

var fireGlobalEvent = (function() {
    if (typeof process !== "undefined" &&
        typeof process.version === "string" &&
        typeof window === "undefined") {
        return function(name, reason, promise) {
            if (name === REJECTION_HANDLED_EVENT) {
                return process.emit(name, promise);
            } else {
                return process.emit(name, reason, promise);
            }
        };
    } else {
        var toWindowMethodNameMap = {};
        toWindowMethodNameMap[UNHANDLED_REJECTION_EVENT] = ("on" +
            UNHANDLED_REJECTION_EVENT).toLowerCase();
        toWindowMethodNameMap[REJECTION_HANDLED_EVENT] = ("on" +
            REJECTION_HANDLED_EVENT).toLowerCase();

        return function(name, reason, promise) {
            var methodName = toWindowMethodNameMap[name];
            var method = window[methodName];
            if (!method) return false;
            if (name === REJECTION_HANDLED_EVENT) {
                method.call(window, promise);
            } else {
                method.call(window, reason, promise);
            }
            return true;
        };
    }
})();

return CapturedTrace;
};
