'use strict';

var _streamline = typeof require === 'function' ? require('streamline-runtime/lib/generators/runtime') : Streamline.require('streamline-runtime/lib/generators/runtime');

var _filename = '/Users/bruno/dev/bluebird/benchmark/madeup-parallel/streamline._js';

var execWithin = _streamline.async(function* _$$execWithin$$(query, tx, _2) {
    {
        return yield _streamline.await(_filename, 5, query, 'execWithin', 1, null, false, [tx, true]);
    }
}, 2, 3);

require('../lib/fakes');

// Futures work on streamlined function so we need to wrap execWithin


module.exports = _streamline.async(function* _$$upload$$(stream, idOrPath, tag, _3) {
    {
        try {
            var queries = new Array(global.parallelQueries);
            var tx = db.begin();

            for (var i = 0, len = queries.length; i < len; ++i) {
                queries[i] = _streamline.future(_filename, 14, null, execWithin, 2, null, false, [FileVersion.insert({ index: i }), tx, false]);
            }

            for (var i = 0, len = queries.length; i < len; ++i) {
                yield _streamline.await(_filename, 18, queries, i, 0, null, false, [true]);
            }

            tx.commit();
        } catch (err) {
            tx.rollback();
            throw err;
        }
    }
}, 3, 4);