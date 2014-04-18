"use strict";
module.exports = function(Promise, PromiseArray, INTERNAL, apiRejection) {

var ASSERT = require("./assert.js");
var all = Promise.all;
var util = require("./util.js");
var canAttach = require("./errors.js").canAttach;
var isArray = util.isArray;
var _cast = Promise._cast;
var es5 = require("./es5.js");

function unpack(values) {
    ASSERT(this.length === 3);
    return Promise$_Map(values, this[0], this[1], this[2]);
}

function Promise$_Map(promises, fn, useBound, ref) {
    if (typeof fn !== "function") {
        return apiRejection(NOT_FUNCTION_ERROR);
    }

    var receiver = void 0;
    if (useBound === USE_BOUND) {
        if (promises._isBound()) {
            receiver = promises._boundTo;
        }
    }
    else if (useBound !== DONT_USE_BOUND) {
        receiver = useBound;
    }

    var shouldUnwrapItems = ref !== void 0;
    if (shouldUnwrapItems) ref.ref = promises;

    if (promises instanceof Promise) {
        var pack = [fn, receiver, ref];
        return promises._then(unpack, void 0, void 0, pack, void 0);
    }

    var promise = new Promise(INTERNAL);
    if (receiver !== void 0) promise._setBoundTo(receiver);
    promise._setTrace(void 0);

    var mapping;

    if (isArray(promises)) {
        mapping = new Mapping(promise,
                                    fn,
                                    promises,
                                    receiver,
                                    shouldUnwrapItems);
    }
    else {
        mapping = new ObjectMapping(promise,
                                     fn,
                                     promises,
                                     receiver,
                                     shouldUnwrapItems);
    }

    mapping.init();
    return promise;
}

var pending = {};
function Mapping(promise, callback, items, receiver, shouldUnwrapItems) {
    this.shouldUnwrapItems = shouldUnwrapItems;
    this.index = 0;
    this.items = items;
    this.callback = callback;
    this.receiver = receiver;
    this.promise = promise;
    this.result = new Array(items.length);
}
util.inherits(Mapping, PromiseArray);

Mapping.prototype.init = function Mapping$init() {
    var items = this.items;
    var len = items.length;
    var result = this.result;
    var isRejected = false;
    for (var i = 0; i < len; ++i) {
        var maybePromise = _cast(items[i], void 0);
        if (maybePromise instanceof Promise) {
            if (maybePromise.isPending()) {
                result[i] = pending;
                maybePromise._proxyPromiseArray(this, i);
            }
            else if (maybePromise.isFulfilled()) {
                result[i] = maybePromise.value();
            }
            else {
                maybePromise._unsetRejectionIsUnhandled();
                if (!isRejected) {
                    this.reject(maybePromise.reason());
                    isRejected = true;
                }
            }
        }
        else {
            result[i] = maybePromise;
        }
    }
    if (!isRejected) this.iterate();
};

Mapping.prototype.isResolved = function Mapping$isResolved() {
    return this.promise === null;
};

Mapping.prototype._promiseProgressed =
function Mapping$_promiseProgressed(value) {
    if (this.isResolved()) return;
    this.promise._progress(value);
};

Mapping.prototype._promiseFulfilled =
function Mapping$_promiseFulfilled(value, index) {
    if (this.isResolved()) return;
    this.result[index] = value;
    if (this.shouldUnwrapItems) this.items[index] = value;
    if (this.index === index) this.iterate();
};

Mapping.prototype._promiseRejected =
function Mapping$_promiseRejected(reason) {
    this.reject(reason);
};

Mapping.prototype.reject = function Mapping$reject(reason) {
    if (this.isResolved()) return;
    var trace = canAttach(reason) ? reason : new Error(reason + "");
    this.promise._attachExtraTrace(trace);
    this.promise._reject(reason, trace);
};

Mapping.prototype.iterate = function Mapping$iterate() {
    var i = this.index;
    var items = this.items;
    var result = this.result;
    var len = items.length;
    var receiver = this.receiver;
    var callback = this.callback;

    for (; i < len; ++i) {
        var value = result[i];
        if (value === pending) {
            this.index = i;
            return;
        }
        try { result[i] = callback.call(receiver, value, i, len); }
        catch (e) { return this.reject(e); }
    }
    this.promise._follow(all(result));
    this.items = this.result = this.callback = this.promise = null;
};


function ObjectMapping(promise, callback, items, receiver, shouldUnwrapItems) {
    this.shouldUnwrapItems = shouldUnwrapItems;
    this.index = 0;
    this.callback = callback;
    this.receiver = receiver;
    this.promise = promise;
    this.keys = es5.keys(items);
    this.items = items;
    this.result = new Array(this.keys.length);
}
util.inherits(ObjectMapping, PromiseArray);

ObjectMapping.prototype.init = function ObjectMapping$init() {
    var items = this.items;
    var keys = this.keys;
    var len = keys.length;
    var result = this.result;
    var isRejected = false;
    for (var i = 0; i < len; ++i) {
        var maybePromise = _cast(items[keys[i]], void 0);
        if (maybePromise instanceof Promise) {
            if (maybePromise.isPending()) {
                result[i] = pending;
                maybePromise._proxyPromiseArray(this, i);
            }
            else if (maybePromise.isFulfilled()) {
                result[i] = maybePromise.value();
            }
            else {
                maybePromise._unsetRejectionIsUnhandled();
                if (!isRejected) {
                    this.reject(maybePromise.reason());
                    isRejected = true;
                }
            }
        }
        else {
            result[i] = maybePromise;
        }
    }
    if (!isRejected) this.iterate();
};

ObjectMapping.prototype.isResolved = function ObjectMapping$isResolved() {
    return this.promise === null;
};

ObjectMapping.prototype._promiseProgressed =
function ObjectMapping$_promiseProgressed(value) {
    if (this.isResolved()) return;
    this.promise._progress(value);
};

ObjectMapping.prototype._promiseFulfilled =
function ObjectMapping$_promiseFulfilled(value, index) {
    if (this.isResolved()) return;
    this.result[index] = value;
    if (this.shouldUnwrapItems) this.items[index] = value;
    if (this.index === index) this.iterate();
};

ObjectMapping.prototype._promiseRejected =
function ObjectMapping$_promiseRejected(reason) {
    this.reject(reason);
};

ObjectMapping.prototype.reject = function ObjectMapping$reject(reason) {
    if (this.isResolved()) return;
    var trace = canAttach(reason) ? reason : new Error(reason + "");
    this.promise._attachExtraTrace(trace);
    this.promise._reject(reason, trace);
};

ObjectMapping.prototype.iterate = function ObjectMapping$iterate() {
    var i = this.index;
    var keys = this.keys;
    var result = this.result;
    var len = keys.length;
    var receiver = this.receiver;
    var callback = this.callback;

    for (; i < len; ++i) {
        var value = result[i];
        if (value === pending) {
            this.index = i;
            return;
        }
        try { result[i] = callback.call(receiver, value, keys[i], len); }
        catch (e) { return this.reject(e); }
    }
    this.promise._follow(all(result));
    this.keys = this.result = this.callback = this.promise = null;
};

Promise.prototype.map = function Promise$map(fn, ref) {
    return Promise$_Map(this, fn, USE_BOUND, ref);
};

Promise.map = function Promise$Map(promises, fn, ref) {
    return Promise$_Map(promises, fn, DONT_USE_BOUND, ref);
};
};
