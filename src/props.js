"use strict";
module.exports = function(Promise, PromiseArray, cast) {
var PropertiesPromiseArray = require("./properties_promise_array.js")(
    Promise, PromiseArray);
var util = require("./util.js");
var apiRejection = require("./errors_api_rejection")(Promise);
var isObject = util.isObject;

function Promise$_Props(promises, useBound) {
    var ret;
    var castValue = cast(promises, void 0);

    if (!isObject(castValue)) {
        return apiRejection(PROPS_TYPE_ERROR);
    }
    else if (castValue instanceof Promise) {
        ret = castValue._then(Promise.props, void 0, void 0,
                        void 0, void 0);
    }
    else {
        ret = new PropertiesPromiseArray(
            castValue,
            useBound === USE_BOUND && castValue._isBound()
                        ? castValue._boundTo
                        : void 0
       ).promise();
        //The constructor took care of it
        useBound = DONT_USE_BOUND;
    }
    if (useBound === USE_BOUND && castValue._isBound()) {
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
