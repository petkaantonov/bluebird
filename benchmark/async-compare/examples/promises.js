var when = require('when'), 
    fn = require('when/function'), 
    p = require('../lib/promiseSupport.js');
   

require('../lib/fakesP');

// Assume Version = objectLift(version), File = objectLift(file) etc.
module.exports = function upload(stream, idOrPath, tag, done) {
    var blob = blobManager.create(account);
    var tx = db.begin();
    var blobIdP = blob.put(stream); 
    var fileP = self.byUuidOrPath(idOrPath).get();
    var previousIdP = p.ternary(fileP, p.get(fileP, 'version'), null);
    var versionP = p.allObject({
        userAccountId: userAccount.id,
        date: new Date(),
        blobId: blobIdP,
        creatorId: userAccount.id,
        previousId: previousIdP,
    });
    versionP = p.set(versionP, p.allObject({
        id: fn.call(Version.createHash, versionP)
    }));
    // Even if Version.insert has been lifted, it returns a promise and 
    // therefore we cannot call execWithin. We have to wait for the promise 
    // to resolve
    var versionInsert = p.eventuallyCall(
        Version.insert(versionP), 'execWithin', tx);
    var versionIdP = p.get(versionP, 'id');
    var fileIdP = p.if (p.not(fileP), function () {
        var splitPath = idOrPath.split('/');
        var fileName = splitPath[splitPath.length - 1];
        var newId = uuid.v1();
        p.eventuallyCall(self.createQuery(idOrPath, p.allObject({
            id: newId,
            userAccountId: userAccount.id,
            name: fileName,
            version: versionIdP
        }), 'execWithin', tx)).then(function() {
            return newId;
        });
    }, function() { 
        return p.get(fileP, 'id'); 
    });
    var addFileVersion = p.eventuallyCall(
        FileVersion.insert(p.allObject({
            fileId: fileIdP,
            versionId: versionIdP
        })), 'execWithin', tx); 
    var fileUpdate = p.eventuallyCall(File.whereUpdate(
        p.allObject({ id: fileIdP }), 
        p.allObject({ version: p.get(versionP, 'id') })),
        'execWithin', tx);
    when.all([versionInsert, addFileVersion, fileUpdate]).then(function() {
        tx.commit();
        return done();
    }, function(err) {
        tx.rollback();
        return done(new Error(err));
    });
}
