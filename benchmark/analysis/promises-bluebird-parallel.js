global.useBluebird = true;
global.useQ = false;
global.parallelQueries = 25;
var Promise = require('../../js/release/bluebird.js');
require('../lib/fakesP');

module.exports = function upload(stream, idOrPath, tag, done) {
    var queries = new Array(global.parallelQueries);
    var tx = db.begin();

    for( var i = 0, len = queries.length; i < len; ++i ) {
        queries[i] = FileVersion.insert({index: i}).execWithin(tx);
    }

    Promise.all(queries).then().then(function() {
        tx.commit();
        done();
    }, function(err) {
        tx.rollback();
        done(err);
    });
}
