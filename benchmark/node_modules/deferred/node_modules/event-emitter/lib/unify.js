'use strict';

var forEach    = require('es5-ext/lib/Object/for-each')
  , validValue = require('es5-ext/lib/Object/valid-value')
  , id         = require('./_id')

  , push = Array.prototype.apply, defineProperty = Object.defineProperty
  , d = { configurable: true, enumerable: false, writable: true }
  , colId = id + 'l_';

module.exports = function (e1, e2) {
	var data;
	validValue(e1) && validValue(e2);
	if (!e1.hasOwnProperty(id)) {
		if (!e2.hasOwnProperty(id)) {
			d.value = {};
			defineProperty(e1, id, d);
			defineProperty(e2, id, d);
			d.value = null;
			return;
		}
		d.value = e2[id];
		defineProperty(e1, id, d);
		d.value = null;
		return;
	}
	data = d.value = e1[id];
	if (!e2.hasOwnProperty(id)) {
		defineProperty(e2, id, d);
		d.value = null;
		return;
	}
	if (data === e2[id]) return;
	forEach(e2[id], function (listener, name) {
		if (!data.hasOwnProperty(name)) {
			data[name] = listener;
			return;
		}
		if (data[name].hasOwnProperty(colId)) {
			if (listener.hasOwnProperty(colId)) push.apply(data[name], listener);
			else data[name].push(listener);
		} else if (listener.hasOwnProperty(colId)) {
			listener.unshift(data[name]);
			data[name] = listener;
		} else {
			(data[name] = [data[name], listener])[colId] = true;
		}
	});
	defineProperty(e2, id, d);
	d.value = null;
};
