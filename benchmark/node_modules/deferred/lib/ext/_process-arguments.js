'use strict';

var arrayOf   = require('es5-ext/lib/Array/of')
  , deferred  = require('../deferred')
  , isPromise = require('../is-promise')

  , push = Array.prototype.push, slice = Array.prototype.slice;

module.exports = function (args, length) {
	var i, l;
	if ((length != null) && (args.length !== length)) {
		args = slice.call(args, 0, length);
		if (args.length < length) {
			push.apply(args, new Array(length - args.length));
		}
	}
	for (i = 0, l = args.length; i < l; ++i) {
		if (isPromise(args[i])) {
			if (!args[i].resolved) {
				if (l > 1) return deferred.apply(null, args);
				return args[0](arrayOf);
			}
			if (args[i].failed) return args[i];
			args[i] = args[i].value;
		}
	}
	return args;
};
