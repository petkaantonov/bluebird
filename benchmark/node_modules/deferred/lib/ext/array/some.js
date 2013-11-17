// Promise aware Array's some

'use strict';

var isError   = require('es5-ext/lib/Error/is-error')
  , extend    = require('es5-ext/lib/Object/extend')
  , value     = require('es5-ext/lib/Object/valid-value')
  , callable  = require('es5-ext/lib/Object/valid-callable')
  , deferred  = require('../../deferred')
  , isPromise = require('../../is-promise')

  , call = Function.prototype.call
  , Some;

Some = function (list, cb, context) {
	this.list = list;
	this.cb = cb;
	this.context = context;
	this.length = list.length >>> 0;

	while (this.current < this.length) {
		if (this.current in list) {
			extend(this, deferred());
			this.processCb = this.processCb.bind(this);
			this.processValue = this.processValue.bind(this);
			this.process();
			return this.promise;
		}
		++this.current;
	}
	return deferred(false);
};

Some.prototype = {
	current: 0,
	process: function () {
		var value = this.list[this.current];
		if (isPromise(value)) {
			if (!value.resolved) {
				value.end(this.processCb, this.resolve);
				return;
			}
			value = value.value;
			if (isError(value)) {
				this.resolve(value);
				return;
			}
		} else if (isError(value) && !this.cb) {
			this.resolve(value);
			return;
		}
		this.processCb(value);
	},
	processCb: function (value) {
		if (this.cb) {
			try {
				value = call.call(this.cb, this.context, value, this.current,
					this.list);
			} catch (e) {
				this.resolve(e);
				return;
			}
			if (isPromise(value)) {
				if (!value.resolved) {
					value.end(this.processValue, this.resolve);
					return;
				}
				value = value.value;
			}
			if (isError(value)) {
				this.resolve(value);
				return;
			}
		}
		this.processValue(value);
	},
	processValue: function (value) {
		if (value) {
			this.resolve(true);
			return;
		}
		while (++this.current < this.length) {
			if (this.current in this.list) {
				this.process();
				return;
			}
		}
		this.resolve(false);
	}
};

module.exports = function (cb/*, thisArg*/) {
	value(this);
	((cb == null) || callable(cb));

	return new Some(this, cb, arguments[1]);
};
