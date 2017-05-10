global.useAction = true;
var Action = require('action-js');
require('../lib/fakesP');

var actionFn = Action.co(function* upload(tx, stream, idOrPath, tag) {
    var blob = blobManager.create(account);
    var blobId = yield blob.put(stream);
    var file = yield self.byUuidOrPath(idOrPath).get();

    var previousId = file ? file.version : null;
    version = {
        userAccountId: userAccount.id,
        date: new Date(),
        blobId: blobId,
        creatorId: userAccount.id,
        previousId: previousId,
    };
    version.id = Version.createHash(version);
    yield Version.insert(version).execWithin(tx);
    if (!file) {
        var splitPath = idOrPath.split('/');
        var fileName = splitPath[splitPath.length - 1];
        file = {
            id: uuid.v1(),
            userAccountId: userAccount.id,
            name: fileName,
            version: version.id
        }
        var query = yield self.createQuery(idOrPath, file);
        yield query.execWithin(tx);
    }
    yield FileVersion.insert({fileId: file.id, versionId: version.id})
        .execWithin(tx);
    yield File.whereUpdate({id: file.id}, {version: version.id})
        .execWithin(tx);
});

module.exports = function(stream, idOrPath, tag, done){
    var tx = db.begin();
    actionFn(tx, stream, idOrPath, tag)
    ._go(function(data){
        if(data instanceof Error){
            tx.rollback();
            return done(data);
        }else{
            tx.commit();
            return done();
        }
    });
}

