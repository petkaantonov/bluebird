var fibrous = require('fibrous');
require('../lib/fakes');

module.exports = fibrous(function upload(stream, idOrPath, tag, done) {
    var blob = blobManager.create(account);
    var tx = db.begin();
    try {
        var blobId = blob.sync.put(stream); 
        var file = self.byUuidOrPath(idOrPath).sync.get(); 
        var previousId = file ? file.version : null;
        var version = {
            userAccountId: userAccount.id,
            date: new Date(),
            blobId: blobId,
            creatorId: userAccount.id,
            previousId: previousId,
        };
        version.id = Version.createHash(version);
        Version.insert(version).sync.execWithin(tx);
        if (!file) {
            var splitPath = idOrPath.split('/');
            var fileName = splitPath[splitPath.length - 1];
            var newId = uuid.v1();
            var file = {
                id: newId,
                userAccountId: userAccount.id,
                name: fileName,
                version: version.id
            }
            var q = self.sync.createQuery(idOrPath, file);
            q.sync.execWithin(tx);
        }
        FileVersion.insert({fileId: file.id, versionId: version.id})
            .sync.execWithin(tx); 
        File.whereUpdate({id: file.id}, {version: version.id})
            .sync.execWithin(tx); 
        tx.sync.commit(); 
    } catch (err) {        
        tx.sync.rollback();
        throw err;
    }
});
