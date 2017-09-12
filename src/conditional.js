module.exports = function _conditionals(Promise) {
  Promise.prototype.thenIf = thenIf;
  Promise.prototype.tapIf  = tapIf;

  function thenIf(cond, ifTrue = (x) => x, ifFalse = (x) => null) {
    return value => Promise.resolve(cond(value))
      .then(ans => ans ? ifTrue(value) : ifFalse(value))
  }

  function tapIf(cond, ifTrue = (x) => x, ifFalse = (x) => null) {
    return value => Promise.resolve(cond(value))
      .tap(ans => ans ? ifTrue(value) : ifFalse(value))
  }

}
