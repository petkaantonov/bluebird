// Promise aware Array's map

'use strict';

var isError   = require('es5-ext/lib/Error/is-error')
  , extend    = require('es5-ext/lib/Object/extend')
  , value     = require('es5-ext/lib/Object/valid-value')
  , callable  = require('es5-ext/lib/Object/valid-callable')
  , deferred  = require('../../deferred')
  , isPromise = require('../../is-promise')

  , every = Array.prototype.every
  , call = Function.prototype.call

  , DMap;

DMap = function (list, cb, context) {
	this.list = list;
	this.cb = cb;
	this.context = context;
	this.result = new Array(list.length >>> 0);

	extend(this, deferred());
	every.call(list, this.process, this);
	if (!this.waiting) {
		return this.resolve(this.result);
	}
	this.initialized = true;

	return this.promise;
};

DMap.prototype = {
	waiting: 0,
	initialized: false,
	process: function (value, index) {
		++this.waiting;
		if (isPromise(value)) {
			if (!value.resolved) {
				value.end(this.processCb.bind(this, index), this.resolve);
				return true;
			}
			value = value.value;
			if (isError(value)) {
				this.resolve(value);
				return false;
			}
		} else if (isError(value) && !this.cb) {
			this.resolve(value);
			return false;
		}
		return this.processCb(index, value);
	},
	processCb: function (index, value) {
		if (this.promise.resolved) {
			return false;
		}
		if (this.cb) {
			try {
				value = call.call(this.cb, this.context, value, index, this.list);
			} catch (e) {
				this.resolve(e);
				return false;
			}
			if (isPromise(value)) {
				if (!value.resolved) {
					value.end(this.processValue.bind(this, index), this.resolve);
					return true;
				}
				value = value.value;
			}
			if (isError(value)) {
				this.resolve(value);
				return false;
			}
		}
		this.processValue(index, value);
		return true;
	},
	processValue: function (index, value) {
		if (this.promise.resolved) {
			return;
		}
		this.result[index] = value;
		if (!--this.waiting && this.initialized) {
			this.resolve(this.result);
		}
	}
};

module.exports = function (cb/*, thisArg*/) {
	value(this);
	((cb == null) || callable(cb));

	return new DMap(this, cb, arguments[1]);
};
