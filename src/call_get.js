"use strict";
module.exports = function(Promise) {

function Promise$caller(obj) {
    var len = this.length;
    switch (len) {
        case 2: return obj[this[1]](this[0]);
        case 3: return obj[this[2]](this[0], this[1]);
        case 4: return obj[this[3]](this[0], this[1], this[2]);
        case 1: return obj[this[0]]();
        default: return obj[this.pop()].apply(obj, this);
    }
}

Promise.prototype.call = function Promise$call(methodName) {
    INLINE_SLICE(args, arguments, 1);
    args.push(methodName);
    return this._then(
        Promise$caller,
        void 0,
        void 0,
        args,
        void 0
   );
};

function Promise$getter(obj) {
    var prop = typeof this === "string"
        ? this
        : ("" + this);
    return obj[prop];
}
Promise.prototype.get = function Promise$get(propertyName) {
    return this._then(
        Promise$getter,
        void 0,
        void 0,
        propertyName,
        void 0
   );
};
};
