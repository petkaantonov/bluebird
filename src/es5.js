var isES5 = (function(){
    "use strict";
    return this === void 0;
})();

if (isES5) {
    module.exports = {
        freeze: Object.freeze,
        defineProperty: Object.defineProperty,
        keys: Object.keys,
        getPrototypeOf: Object.getPrototypeOf,
        isArray: Array.isArray,
        isES5: isES5
    };
}

else {
    var has = {}.hasOwnProperty;
    var str = {}.toString;
    var proto = {}.constructor.prototype;

    module.exports = {
        freeze: function ObjectFreeze(obj) {
            return obj;
        },

        defineProperty: function ObjectDefineProperty(o, key, desc) {
            o[key] = desc.value;
            return o;
        },

        keys: function ObjectKeys(o) {
            var ret = [];
            for (var key in o) {
                if (has.call(o, key)) {
                    ret.push(key);
                }
            }
            return ret;
        },

        getPrototypeOf: function ObjectGetPrototypeOf(obj) {
            try {
                return Object(obj).constructor.prototype;
            }
            catch (e) {
                return proto;
            }
        },

        isArray: function ArrayIsArray(obj) {
            try {
                return str.call(obj) === "[object Array]";
            }
            catch(e) {
                return false;
            }
        },

        isES5: isES5
    };
}
