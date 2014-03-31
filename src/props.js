"use strict";
module.exports = function(Promise, PromiseArray, cast) {
var ASSERT = require("./assert.js");
var util = require("./util.js");
var apiRejection = require("./errors_api_rejection")(Promise);
var isObject = util.isObject;
var es5 = require("./es5.js");

function PropertiesPromiseArray(obj, boundTo) {
    var keys = es5.keys(obj);
    var values = new Array(keys.length);
    for (var i = 0, len = values.length; i < len; ++i) {
        values[i] = obj[keys[i]];
    }
    this.constructor$(values, boundTo);
    if (!this._isResolved()) {
        for (var i = 0, len = keys.length; i < len; ++i) {
            values.push(keys[i]);
        }
        ASSERT(this._values.length === 2 * this.length());
    }
}
util.inherits(PropertiesPromiseArray, PromiseArray);

//Override
PropertiesPromiseArray.prototype._init =
function PropertiesPromiseArray$_init() {
    this._init$(void 0, RESOLVE_OBJECT) ;
};

//Override
PropertiesPromiseArray.prototype._promiseFulfilled =
function PropertiesPromiseArray$_promiseFulfilled(value, index) {
    if (this._isResolved()) return;
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
PropertiesPromiseArray.prototype._promiseProgressed =
function PropertiesPromiseArray$_promiseProgressed(value, index) {
    if (this._isResolved()) return;

    this._promise._progress({
        key: this._values[index + this.length()],
        value: value
    });
};

// Override
PropertiesPromiseArray.prototype.shouldCopyValues =
function PropertiesPromiseArray$_shouldCopyValues() {
    return false;
};

function Promise$_Props(promises, useBound) {
    var ret;
    var castValue = cast(promises, void 0);

    if (!isObject(castValue)) {
        return apiRejection(PROPS_TYPE_ERROR);
    }
    else if (castValue instanceof Promise) {
        ret = castValue._then(Promise.props, void 0, void 0, void 0, void 0);
    }
    else {
        ret = new PropertiesPromiseArray(
            castValue,
            useBound === USE_BOUND ? castValue._boundTo : void 0).promise();
        //The constructor took care of it
        useBound = DONT_USE_BOUND;
    }
    if (useBound === USE_BOUND) {
        ret._setBoundTo(castValue._boundTo);
    }
    return ret;
}

Promise.prototype.props = function Promise$props() {
    return Promise$_Props(this, USE_BOUND);
};

Promise.props = function Promise$Props(promises) {
    return Promise$_Props(promises, DONT_USE_BOUND);
};
};
