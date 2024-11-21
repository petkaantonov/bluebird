"use strict";

module.exports = function _conditionals(Promise) {
  Promise.prototype.tapIf = tapIf;
  Promise.prototype.thenIf = thenIf;
  Promise.thenIf = _thenIf;

  function thenIf(cond, ifTrue, ifFalse) {
    if (this instanceof Promise) {
      return this.then(function(value) {
        return _thenIf(cond, ifTrue, ifFalse)(value);
      });
    }
    return _thenIf(cond, ifTrue, ifFalse);
  }

  function tapIf(cond, ifTrue, ifFalse) {
    if (this instanceof Promise) {
      return this.then(function(value) {
        return _thenIf(cond, ifTrue, ifFalse, true)(value);
      });
    }
    return _thenIf(cond, ifTrue, ifFalse, true);
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
    var returnValue =
      arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

    return function(value) {
      return Promise.resolve(cond(value))
        .then(function(ans) {
          return ans ? ifTrue(value) : ifFalse(value);
        })
        .then(function(v) {
          return returnValue ? value : v;
        });
    };
  }
};
