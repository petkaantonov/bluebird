"use strict";

module.exports = function _conditionals(Promise) {
  Promise.prototype.thenIf = thenIf;
  Promise.thenIf = _thenIf;

  function thenIf() {
    var cond =
      arguments.length > 0 && arguments[0] !== undefined
        ? arguments[0]
        : function(x) {
            return x;
          };
    var ifTrue =
      arguments.length > 1 && arguments[1] !== undefined
        ? arguments[1]
        : function(x) {
            return x;
          };
    var ifFalse =
      arguments.length > 2 && arguments[2] !== undefined
        ? arguments[2]
        : function() {
            return null;
          };

    if (this instanceof Promise) {
      return this.then(function(value) {
        return _thenIf(cond, ifTrue, ifFalse)(value);
      });
    } else {
      return _thenIf(cond, ifTrue, ifFalse);
    }
  }

  function _thenIf() {
    var cond =
      arguments.length > 0 && arguments[0] !== undefined
        ? arguments[0]
        : function(x) {
            return x;
          };
    var ifTrue =
      arguments.length > 1 && arguments[1] !== undefined
        ? arguments[1]
        : function(x) {
            return x;
          };
    var ifFalse =
      arguments.length > 2 && arguments[2] !== undefined
        ? arguments[2]
        : function() {
            return null;
          };

    return function(value) {
      return Promise.resolve(cond(value)).then(function(ans) {
        return ans ? ifTrue(value) : ifFalse(value);
      });
    };
  }
};
