global.useAction = true;
var Action = require('action-js');
require('../lib/fakesP');

module.exports = function upload(stream, idOrPath, tag, done) {
    var blob = blobManager.create(account);
    var tx = db.begin();
    var blobIdP = blob.put(stream);
    var fileP = self.byUuidOrPath(idOrPath).get();
    var version, fileId, file;

    Action.join(blobIdP, fileP, function(blobId, fileV) {
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
    }).next(function() {
        if (!file) {
            var splitPath = idOrPath.split('/');
            var fileName = splitPath[splitPath.length - 1];
            var newId = uuid.v1();
            return self.createQuery(idOrPath, {
                id: newId,
                userAccountId: userAccount.id,
                name: fileName,
                version: version.id
            }).next(function(q) {
                return q.execWithin(tx);
            }).next(function() {
                return newId;
            });
        } else {
            return file.id;
        }
    }).next(function(fileIdV) {
        fileId = fileIdV;
        return FileVersion.insert({
            fileId: fileId,
            versionId: version.id
        }).execWithin(tx);
    }).next(function() {
        return File.whereUpdate({id: fileId}, {version: version.id})
            .execWithin(tx);
    })._go(function(data){
        if(data instanceof Error){
            tx.rollback();
            return done(data);
        }else{
            tx.commit();
            return done();
        }
    });
}

