global.useDeferred = true;

var deferred = require('deferred');

require('../lib/fakesP');

function identity(v) {
    return v;
}

module.exports = function upload(stream, idOrPath, tag, done) {
    var blob = blobManager.create(account);
    var tx = db.begin();
    var blobIdP = blob.put(stream);
    var fileP = self.byUuidOrPath(idOrPath).get();
    var version, fileId, file;
    //Couldn't find .all in docs, this seems closest
    deferred.map([blobIdP, fileP], identity)(function(all) {
        var blobId = all[0], fileV = all[1];
        file = fileV;
        var previousId = file ? file.version : null;
        version = {
            userAccountId: userAccount.id,
            date: new Date(),
            blobId: blobId,
            creatorId: userAccount.id,
            previousId: previousId,
        };
        version.id = Version.createHash(version);
        return Version.insert(version).execWithin(tx);
    })(function() {
        if (!file) {
            var splitPath = idOrPath.split('/');
            var fileName = splitPath[splitPath.length - 1];
            var newId = uuid.v1();
            return self.createQueryCtxless(idOrPath, {
                id: newId,
                userAccountId: userAccount.id,
                name: fileName,
                version: version.id
            })(function(q) {
                return q.execWithin(tx);
            })(function() {
                return newId;
            });
        } else {
            return file.id;
        }
    })(function(fileIdV) {
        fileId = fileIdV;
        return FileVersion.insert({
            fileId: fileId,
            versionId: version.id
        }).execWithin(tx);
    })(function() {
        return File.whereUpdate({id: fileId}, {version: version.id})
            .execWithin(tx);
    })(function() {
        tx.commit();
        return done();
    }, function(err) {
        tx.rollback();
        return done(err);
    });
}
