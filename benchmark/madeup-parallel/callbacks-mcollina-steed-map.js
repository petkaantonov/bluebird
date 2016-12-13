require('../lib/fakes');
var steed = require('steed');

function work (op, cb) {
    op.execWithin(this.tx, cb);
}

function Status (tx, done) {
    this.tx = tx;
    this.done = done;
}

function finish (err) {
    if (err) {
        this.tx.rollback();
        this.done(err);
    }
    else {
        this.tx.commit();
        this.done();
    }
}

module.exports = function upload(stream, idOrPath, tag, done) {
    var queries = new Array(global.parallelQueries);
    var tx = db.begin();

    for( var i = 0, len = queries.length; i < len; ++i ) {
      queries[i] = FileVersion.insert({index: i})
    }

    steed.map(new Status(tx, done), queries, work, finish)
}
