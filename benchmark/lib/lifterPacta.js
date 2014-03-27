var Promise = require("pacta");

// fn = function (...args, cb)
var lifter = module.exports = function (fn, thisArg) {
  return function () {
    var p = new Promise();
    fn.apply(thisArg, Array.prototype.slice.call(arguments).concat([function (err, result) {
      if (err) p.reject(err);
      else     p.resolve(result);
    }]));
    return p;
  };
};
