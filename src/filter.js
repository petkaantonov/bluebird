"use strict";
module.exports = function(Promise) {
    var ASSERT = require("./assert.js");
    var isArray = require("./util.js").isArray;

    function Promise$_filter(booleans) {
        var values = this._settledValue;
        ASSERT(isArray(values));
        ASSERT(isArray(booleans));
        ASSERT(values.length === booleans.length);

        var len = values.length;
        var ret = new Array(len);
        var j = 0;

        for (var i = 0; i < len; ++i) {
            var bool = booleans[i];

            if (bool === void 0 && !(i in booleans)) {
                ASSERT(values[i] === void 0);
                ASSERT(!(i in values));
                continue;
            }

            if (bool) ret[j++] = values[i];

        }
        ret.length = j;
        return ret;
    }

    var ref = {ref: null};
    Promise.filter = function Promise$Filter(promises, fn) {
        return Promise.map(promises, fn, ref)
            ._then(Promise$_filter, void 0, void 0,
                    ref.ref, void 0, Promise.filter);
    };

    Promise.prototype.filter = function Promise$filter(fn) {
        return this.map(fn, ref)
            ._then(Promise$_filter, void 0, void 0,
                    ref.ref, void 0, this.filter);
    };
};
