global.useBluebird = true;
global.useQ = false;
var bluebird = require('../../js/release/bluebird.js');
require('../lib/fakesP');

module.exports = bluebird.coroutine(function* upload(stream, idOrPath, tag, done) {
    try {
        var blob = blobManager.create(account);
        var tx = db.begin();
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
        triggerIntentionalError();
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
            triggerIntentionalError();
        }
        yield FileVersion.insert({fileId: file.id, versionId: version.id})
            .execWithin(tx);
        triggerIntentionalError();
        yield File.whereUpdate({id: file.id}, {version: version.id})
            .execWithin(tx);
        triggerIntentionalError();
        tx.commit();
        done();
    } catch (err) {
        tx.rollback();
        done(err);
    }
});
