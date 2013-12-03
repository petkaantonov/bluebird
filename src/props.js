"use strict";
module.exports = function(Promise, PromiseArray) {
    var PropertiesPromiseArray = require("./properties_promise_array.js")(
        Promise, PromiseArray);
    var util = require("./util.js");
    var apiRejection = require("./errors_api_rejection")(Promise);
    var isObject = util.isObject;

    function Promise$_Props(promises, useBound, caller) {
        var ret;
        var castValue = Promise._cast(promises, caller, void 0);

        if (!isObject(castValue)) {
            return apiRejection(PROPS_TYPE_ERROR);
        }
        else if (Promise.is(castValue)) {
            ret = castValue._then(Promise.props, void 0, void 0,
                            void 0, void 0, caller);
        }
        else {
            ret = new PropertiesPromiseArray(
                castValue,
                caller,
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
        return Promise$_Props(this, USE_BOUND, this.props);
    };

    Promise.props = function Promise$Props(promises) {
        return Promise$_Props(promises, DONT_USE_BOUND, Promise.props);
    };
};
