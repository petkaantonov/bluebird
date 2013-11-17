// This construct deferred with all needed goodies that are being exported
// when we import 'deferred' by main name.
// All available promise extensions are also initialized.

'use strict';

var call   = Function.prototype.call
  , extend = require('es5-ext/lib/Object/extend');

module.exports = extend(require('./deferred'), {
	isPromise:     require('./is-promise'),
	validPromise:  require('./valid-promise'),
	delay:         call.bind(require('./ext/function/delay')),
	gate:          call.bind(require('./ext/function/gate')),
	monitor:       require('./monitor'),
	promisify:     call.bind(require('./ext/function/promisify')),
	promisifySync: call.bind(require('./ext/function/promisify-sync')),
	map:           call.bind(require('./ext/array/map')),
	reduce:        call.bind(require('./ext/array/reduce')),
	some:          call.bind(require('./ext/array/some'))
}, require('./profiler'));

require('./ext/promise/aside');
require('./ext/promise/catch');
require('./ext/promise/cb');
require('./ext/promise/finally');
require('./ext/promise/get');
require('./ext/promise/invoke');
require('./ext/promise/invoke-async');
require('./ext/promise/map');
require('./ext/promise/match');
require('./ext/promise/some');
require('./ext/promise/reduce');
