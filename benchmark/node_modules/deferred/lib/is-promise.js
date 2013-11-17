// Whether given object is a promise

'use strict';

module.exports = function (o) {
	return (typeof o === 'function') && (typeof o.then === 'function');
};
