// 'finally' - Promise extension
//
// promise.finally(cb)
//
// Called on promise resolution returns same promise, doesn't pass any values to
// provided callback

'use strict';

var callable = require('es5-ext/lib/Object/valid-callable')
  , deferred = require('../../deferred');

deferred.extend('finally', function (cb) {
	callable(cb);
	if (!this.pending) this.pending = [];
	this.pending.push('finally', arguments);
	return this;
}, function (cb) { cb(); }, function (cb) {
	callable(cb)();
	return this;
});
