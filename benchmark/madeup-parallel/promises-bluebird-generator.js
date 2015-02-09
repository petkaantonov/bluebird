global.useBluebird = true;
global.useQ = false;
var bluebird = require('../../js/release/bluebird.js');
require('../lib/fakesP');

module.exports = bluebird.coroutine(function* upload(stream, idOrPath, tag, done) {
    var queries = new Array(global.parallelQueries);
    var tx = db.begin();

    for( var i = 0, len = queries.length; i < len; ++i ) {
        queries[i] = FileVersion.insert({index: i}).execWithin(tx);
    }

    try {
        yield bluebird.all(queries);
        tx.commit();
        done();
    }
    catch(e) {
        tx.rollback();
        done(e);
    }
});
