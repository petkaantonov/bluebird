global.useHighland = true;
var _ = require("highland");
require('../lib/fakesObservable');

module.exports = function upload(stream, idOrPath, tag, done) {
    var blob = blobManager.create(account);
    var tx = db.begin();
    var blobIdP = blob.put(stream);
    var fileP = self.byUuidOrPath(idOrPath).get();
    var version, fileId, file;

    _([blobIdP, fileP]).merge().apply(function(blobId, file) {
        var previousId = file ? file.version : null;
        version = {
            userAccountId: userAccount.id,
            date: new Date(),
            blobId: blobId,
            creatorId: userAccount.id,
            previousId: previousId,
        };
        version.id = Version.createHash(version);
        Version.insert(version).execWithin(tx).flatMap(function() {
            if (!file) {
                var splitPath = idOrPath.split('/');
                var fileName = splitPath[splitPath.length - 1];
                var newId = uuid.v1();
                return self.createQuery(idOrPath, {
                    id: newId,
                    userAccountId: userAccount.id,
                    name: fileName,
                    version: version.id
                }).flatMap(function(q) {
                    return q.execWithin(tx);
                }).map(function() {
                    return newId;
                });
            } else {
                return _([file.id]);
            }
        }).flatMap(function(fileIdV) {
            fileId = fileIdV;
            return FileVersion.insert({
                fileId: fileId,
                versionId: version.id
            }).execWithin(tx);
        }).flatMap(function() {
            return File.whereUpdate({id: fileId}, {version: version.id})
                .execWithin(tx);
        }).stopOnError(function(err) {
            tx.rollback();
            done(err);
        }).apply(function(v) {
            tx.commit();
            done();
        });
    });
}
