"use strict";
module.exports = function(Promise) {
var es5 = require("./es5.js").isES5;
function returner() {
    return es5 ? this : this.value;
}
function thrower() {
    throw es5 ? this : this.reason;
}

Promise.prototype["return"] =
Promise.prototype.thenReturn = function (value) {
    if (!es5) value = {value: value};
    return this._then(
        returner, undefined, undefined, value, undefined);
};

Promise.prototype["throw"] =
Promise.prototype.thenThrow = function (reason) {
    if (!es5) reason = {reason: reason};
    return this._then(thrower, undefined, undefined, reason, undefined);
};

Promise.prototype.catchThrow = function (reason) {
    if (arguments.length === 1) {
        if (!es5) reason = {reason: reason};
        return this._then(undefined, thrower, undefined, reason, undefined);
    } else {
        var _reason = arguments[1];
        var handler = function() {throw _reason;};
        return this.caught(reason, handler);
    }
};

Promise.prototype.catchReturn = function (value) {
    if (arguments.length === 1) {
        if (!es5) value = {value: value};
        return this._then(undefined, returner, undefined, value, undefined);
    } else {
        var _value = arguments[1];
        var handler = function() {return _value;};
        return this.caught(value, handler);
    }
};
};
