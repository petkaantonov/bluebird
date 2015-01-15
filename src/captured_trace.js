"use strict";
module.exports = function() {
var async = require("./async.js");
var ASSERT = require("./assert.js");
var inherits = require("./util.js").inherits;
var defineProperty = require("./es5.js").defineProperty;
var rtraceline = null;
var formatStack = null;

function CapturedTrace(parent) {
    ASSERT(parent === undefined || parent instanceof CapturedTrace);
    this._parent = parent;
    captureStackTrace(this, CapturedTrace);

}
inherits(CapturedTrace, Error);

CapturedTrace.prototype.parent = function() {
    return this._parent;
};

CapturedTrace.prototype.setParent = function(parent) {
    if (parent === this) return;
    ASSERT(parent instanceof CapturedTrace);
    this._parent = parent;
};

CapturedTrace.prototype.hasParent = function() {
    return this._parent !== undefined;
};

CapturedTrace.prototype.attachExtraTrace = function(error) {
    var trace = this;
    var stack = error.stack;
    stack = typeof stack === "string" ? stack.split("\n") : [];
    this.protectErrorMessageNewlines(stack);
    var headerLineCount = 1;
    var combinedTraces = 1;

    do {
        stack = trace.combine(stack);
        combinedTraces++;
    } while ((trace = trace.parent()) != null);

    var stackTraceLimit = Error.stackTraceLimit || 10;
    var max = (stackTraceLimit + headerLineCount) * combinedTraces;
    var len = stack.length;
    if (len > max) {
        stack.length = max;
    }

    if (len > 0)
        stack[0] = stack[0].split(NEWLINE_PROTECTOR).join("\n");

    if (stack.length <= headerLineCount) {
        error.stack = "(No stack trace)";
    } else {
        error.stack = stack.join("\n");
    }
};

CapturedTrace.prototype.combine = function(current) {
    var prev = this.stack.split("\n");
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

    current.push(FROM_PREVIOUS_EVENT);
    var lines = current.concat(prev);

    var ret = [];

    //Eliminate library internal stuff and async callers
    //that nobody cares about
    for (var i = 0, len = lines.length; i < len; ++i) {
        if (((rtraceline.test(lines[i]) && shouldIgnore(lines[i])) ||
            (i > 0 && !rtraceline.test(lines[i])) &&
            lines[i] !== FROM_PREVIOUS_EVENT)
       ) {
            continue;
        }
        ret.push(lines[i]);
    }
    return ret;
};

CapturedTrace.prototype.protectErrorMessageNewlines = function(stack) {
    for (var i = 0; i < stack.length; ++i) {
        if (rtraceline.test(stack[i])) {
            break;
        }
    }

    // No multiline error message
    if (i <= 1) return;

    var errorMessageLines = [];
    for (var j = 0; j < i; ++j) {
        errorMessageLines.push(stack.shift());
    }
    stack.unshift(errorMessageLines.join(NEWLINE_PROTECTOR));
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
    //V8
    if (typeof Error.stackTraceLimit === "number" &&
        typeof Error.captureStackTrace === "function") {
        rtraceline = /^\s*at\s*/;
        formatStack = function(stack, error) {
            ASSERT(error !== null);

            if (typeof stack === "string") return stack;

            if (error.name !== undefined &&
                error.message !== undefined) {
                return error.name + ". " + error.message;
            }
            return formatNonError(error);


        };
        var captureStackTrace = Error.captureStackTrace;
        var bluebirdRegexp = /[\\\/]bluebird[\\\/]js[\\\/](main|debug|zalgo)/;
        // For node
        shouldIgnore = function(line) {
            return bluebirdRegexp.test(line);
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

        // Shim Error.stackTraceLimit , this does nothing in SpiderMoney but we
        // want to have it for calculations with Error.stackTraceLimit later
        defineProperty(Error, "stackTraceLimit", {
            writable: true,
            enumerable: false,
            configurable: false,
            value: 25
        });
        rtraceline = /@/;
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
    } else {
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
    }
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
