// Promise aware Array's reduce

'use strict';

var isError   = require('es5-ext/lib/Error/is-error')
  , extend    = require('es5-ext/lib/Object/extend')
  , value     = require('es5-ext/lib/Object/valid-value')
  , callable  = require('es5-ext/lib/Object/valid-callable')
  , deferred  = require('../../deferred')
  , isPromise = require('../../is-promise')

  , call = Function.prototype.call
  , hasOwnProperty = Object.prototype.hasOwnProperty
  , Reduce;

Reduce = function (list, cb, initial, initialized) {
	this.list = list;
	this.cb = cb;
	this.initialized = initialized;
	this.length = list.length >>> 0;

	if (isPromise(initial)) {
		if (!initial.resolved) {
			extend(this, deferred());
			initial.end(function (initial) {
				this.value = initial;
				this.init();
			}.bind(this), this.resolve);
			return this.promise;
		}
		this.value = initial.value;
		if (isError(this.value)) return initial;
	} else {
		this.value = initial;
	}

	return this.init();
};

Reduce.prototype = {
	current: 0,
	state: false,
	init: function () {
		while (this.current < this.length) {
			if (hasOwnProperty.call(this.list, this.current)) break;
			++this.current;
		}
		if (this.current === this.length) {
			if (!this.initialized) {
				throw new Error("Reduce of empty array with no initial value");
			}
			return this.resolve ? this.resolve(this.value) : deferred(this.value);
		}
		if (!this.promise) extend(this, deferred());
		this.processCb = this.processCb.bind(this);
		this.processValue = this.processValue.bind(this);
		this.continue();
		return this.promise;
	},
	continue: function () {
		var result;
		while (!this.state) {
			result = this.process();
			if (this.state !== 'cb') break;
			result = this.processCb(result);
			if (this.state !== 'value') break;
			this.processValue(result);
		}
	},
	process: function () {
		var value = this.list[this.current];
		if (isPromise(value)) {
			if (!value.resolved) {
				value.end(function (result) {
					result = this.processCb(result);
					if (this.state !== 'value') return;
					this.processValue(result);
					if (!this.state) this.continue();
				}.bind(this), this.resolve);
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
		this.state = 'cb';
		return value;
	},
	processCb: function (value) {
		if (!this.initialized) {
			this.initialized = true;
			this.state = 'value';
			return value;
		}
		if (this.cb) {
			try {
				value = call.call(this.cb, undefined, this.value, value, this.current,
					this.list);
			} catch (e) {
				this.resolve(e);
				return;
			}
			if (isPromise(value)) {
				if (!value.resolved) {
					value.end(function (result) {
						this.state = 'value';
						this.processValue(result);
						if (!this.state) this.continue();
					}.bind(this), this.resolve);
					return;
				}
				value = value.value;
			}
			if (isError(value)) {
				this.resolve(value);
				return;
			}
		}
		this.state = 'value';
		return value;
	},
	processValue: function (value) {
		this.value = value;
		while (++this.current < this.length) {
			if (hasOwnProperty.call(this.list, this.current)) {
				this.state = false;
				return;
			}
		}
		this.resolve(this.value);
	}
};

module.exports = function (cb/*, initial*/) {
	value(this);
	((cb == null) || callable(cb));

	return new Reduce(this, cb, arguments[1], arguments.length > 1);
};
