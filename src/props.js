"use strict";
module.exports = function(
    Promise, PromiseArray, tryConvertToPromise, apiRejection) {
var ASSERT = require("./assert.js");
var util = require("./util.js");
var isObject = util.isObject;
var es5 = require("./es5.js");

function PropertiesPromiseArray(obj) {
    var keys = es5.keys(obj);
    var len = keys.length;
    var values = new Array(len * 2);
    for (var i = 0; i < len; ++i) {
        var key = keys[i];
        values[i] = obj[key];
        values[i + len] = key;
    }
    this.constructor$(values);
}
util.inherits(PropertiesPromiseArray, PromiseArray);

//Override
PropertiesPromiseArray.prototype._init = function () {
    this._init$(undefined, RESOLVE_OBJECT) ;
};

//Override
PropertiesPromiseArray.prototype._promiseFulfilled = function (value, index) {
    ASSERT(!this._isResolved());
    ASSERT(!(value instanceof Promise));
    this._values[index] = value;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        var val = {};
        var keyOffset = this.length();
        for (var i = 0, len = this.length(); i < len; ++i) {
            val[this._values[i + keyOffset]] = this._values[i];
        }
        this._resolve(val);
    }
};

//Override
PropertiesPromiseArray.prototype._promiseProgressed = function (value, index) {
    ASSERT(!this._isResolved());

    this._promise._progress({
        key: this._values[index + this.length()],
        value: value
    });
};

// Override
PropertiesPromiseArray.prototype.shouldCopyValues = function () {
    return false;
};

// Override
PropertiesPromiseArray.prototype.getActualLength = function (len) {
    return len >> 1;
};

function props(promises) {
    var ret;
    var castValue = tryConvertToPromise(promises);

    if (!isObject(castValue)) {
        return apiRejection(PROPS_TYPE_ERROR);
    } else if (castValue instanceof Promise) {
        ret = castValue._then(
            Promise.props, undefined, undefined, undefined, undefined);
    } else {
        ret = new PropertiesPromiseArray(castValue).promise();
    }

    if (castValue instanceof Promise) {
        ret._propagateFrom(castValue, PROPAGATE_BIND);
    }
    return ret;
}

Promise.prototype.props = function () {
    return props(this);
};

Promise.props = function (promises) {
    return props(promises);
};
};
