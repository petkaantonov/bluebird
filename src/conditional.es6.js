module.exports = function _conditionals(Promise) {
  Promise.prototype.thenIf  = thenIf
  Promise.thenIf            = _thenIf

  function thenIf(cond = (x) => x, ifTrue = (x) => x, ifFalse = (x) => null) {
    if (this instanceof Promise) {
      return this.then(value => _thenIf(this, cond, ifTrue, ifFalse)(value))
    } else if (cond instanceof Function) {
      return _thenIf(this, cond, ifTrue, ifFalse)
    } else {
      throw new Error('Error calling `thenIf` - Try `this` must be a Promise')
    }
  }

  function _thenIf(promise, cond = (x) => x, ifTrue = (x) => x, ifFalse = (x) => null) {
    return value => Promise.resolve(cond(value))
      .then(ans => ans ? ifTrue(value) : ifFalse(value))
  }
}
