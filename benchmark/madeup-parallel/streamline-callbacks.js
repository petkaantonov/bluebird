'use strict';

var regeneratorRuntime = typeof require === 'function' ? require('streamline-runtime/lib/callbacks/regenerator') : Streamline.require('streamline-runtime/lib/callbacks/regenerator');

var _streamline = typeof require === 'function' ? require('streamline-runtime/lib/callbacks/runtime') : Streamline.require('streamline-runtime/lib/callbacks/runtime');

var _filename = '/Users/bruno/dev/bluebird/benchmark/madeup-parallel/streamline._js';

var execWithin = _streamline.async(regeneratorRuntime.mark(function _$$execWithin$$(query, tx, _2) {
    return regeneratorRuntime.wrap(function _$$execWithin$$$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    _context.next = 2;
                    return _streamline.await(_filename, 5, query, 'execWithin', 1, null, false, [tx, true]);

                case 2:
                    return _context.abrupt('return', _context.sent);

                case 3:
                case 'end':
                    return _context.stop();
            }
        }
    }, _$$execWithin$$, this);
}), 2, 3);

require('../lib/fakes');

// Futures work on streamlined function so we need to wrap execWithin


module.exports = _streamline.async(regeneratorRuntime.mark(function _$$upload$$(stream, idOrPath, tag, _3) {
    var queries, tx, i, len;
    return regeneratorRuntime.wrap(function _$$upload$$$(_context2) {
        while (1) {
            switch (_context2.prev = _context2.next) {
                case 0:
                    _context2.prev = 0;
                    queries = new Array(global.parallelQueries);
                    tx = db.begin();


                    for (i = 0, len = queries.length; i < len; ++i) {
                        queries[i] = _streamline.future(_filename, 14, null, execWithin, 2, null, false, [FileVersion.insert({ index: i }), tx, false]);
                    }

                    i = 0, len = queries.length;

                case 5:
                    if (!(i < len)) {
                            _context2.next = 11;
                            break;
                        }

                    _context2.next = 8;
                    return _streamline.await(_filename, 18, queries, i, 0, null, false, [true]);

                case 8:
                    ++i;
                    _context2.next = 5;
                    break;

                case 11:

                    tx.commit();
                    _context2.next = 18;
                    break;

                case 14:
                    _context2.prev = 14;
                    _context2.t0 = _context2['catch'](0);

                    tx.rollback();
                    throw _context2.t0;

                case 18:
                case 'end':
                    return _context2.stop();
            }
        }
    }, _$$upload$$, this, [[0, 14]]);
}), 3, 4);