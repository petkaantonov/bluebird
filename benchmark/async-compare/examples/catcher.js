var catcher = require('../lib/catcher');
require('../lib/fakes');

module.exports = function upload(stream, idOrPath, tag, done) {
    var blob = blobManager.create(account);
    var tx = db.begin();
    var c = catcher();
    blob.put(stream, c.try(function (blobId) {
        self.byUuidOrPath(idOrPath).get(c.try(function (file) {
            var previousId = file ? file.version : null;
            var version = {
                userAccountId: userAccount.id,
                date: new Date(),
                blobId: blobId,
                creatorId: userAccount.id,
                previousId: previousId,
            };
            version.id = Version.createHash(version);
            Version.insert(version).execWithin(tx, c.try(function () {
                if (!file) {
                    var splitPath = idOrPath.split('/');
                    var fileName = splitPath[splitPath.length - 1];
                    var newId = uuid.v1();
                    self.createQuery(idOrPath, {
                        id: newId,
                        userAccountId: userAccount.id,
                        name: fileName,
                        version: version.id
                    }, c.try(function (q) {
                        q.execWithin(tx, c.try(function () {
                            afterFileExists(newId);
                        }));
                    }))
                }
                else return afterFileExists(file.id);
            }));
            function afterFileExists(fileId) {
                FileVersion.insert({fileId: fileId,versionId: version.id})
                    .execWithin(tx, c.try(function () {
                        File.whereUpdate({id: fileId}, {
                            version: version.id
                        }).execWithin(tx, c.try(function () {
                            tx.commit(done);
                        }));
                    }));
            }
        }));
    }));
    c.catch(function backoff(err) {
        tx.rollback();
        return done(err);
    });
}
