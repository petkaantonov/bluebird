var Rx = require('rx');

require('../lib/fakes');

module.exports = function upload(stream, idOrPath, tag, done) {
    
    var blob = blobManager.create(account),
        tx = db.begin(),
        shouldRollback = false;
    
    blobPutAsObs(blob, stream)
        .selectMany(selectFile(idOrPath))
        .doAction(function() { shouldRollback = true; })
        .selectMany(insertVersion(tx, idOrPath, tag))
        .selectMany(insertFile(tx))
        .selectMany(updateFileVersion(tx))
        .selectMany(commitDBAction)
        .subscribe(
            onSuccessfulCommit,
            onCommitError
        );
    
    function onSuccessfulCommit(commitResultArgs) {
        done.apply(null, commitResultArgs);
    };
    
    function onCommitError(err) {
        if(shouldRollback)
            tx.rollback();
        done(err); 
    }
}

function blobPutAsObs(blob, stream) {
    
    return Rx.Observable.create(function(observer) {
        blob.put(stream, function(err, iBlobId) {
            
            if(err) return observer.onError(err);
            
            observer.onNext(iBlobId);
            observer.onCompleted();
        });
    });
}

function selectFile(idOrPath) {
    
    return function(blobId) {
        
        return Rx.Observable.create(function(observer) {
            
            self.byUuidOrPath(idOrPath).get(function(err, iFile) {
                       
                if(err) return observer.onError(err);
                
                observer.onNext([blobId, iFile]);
                observer.onCompleted();
            });
        });
    }
}

function insertVersion(tx, idOrPath, tag) {
    
    return function(blobIdAndFile) {
        

        var blobId = blobIdAndFile[0],
            iFile  = blobIdAndFile[1],
            previousId = iFile ? iFile.version : null,
            version = {
                userAccountId: userAccount.id,
                date: new Date(),
                blobId: blobId,
                creatorId: userAccount.id,
                previousId: previousId,
                mergedId: null,
                mergeType: 'mine',
                comment: '',
                tag: tag
            },
            slashIndex = idOrPath.lastIndexOf('/'),
            fileName = idOrPath.substring(slashIndex),
            newId = uuid.v1(),
            createFile = createFileAsObs(self, fileName, newId, version, 
                                         idOrPath),
            doQuery = executeQuery(tx, newId),
            createFileObs = createFile.selectMany(doQuery),
            fileExistsObs = Rx.Observable.returnValue(newId);
        
        version.id = Version.createHash(version);
        
        return Rx.Observable.ifThen(
            function() { return !iFile; },
            createFileObs,
            fileExistsObs
        )
        .select(function() {
            return [newId, version.id];
        });
    }
}

function createFileAsObs(self, fileName, newId, version, idOrPath) {
        
    return Rx.Observable.create(function(observer) {
        
        
        var query = {
            id: newId,
            userAccountId: userAccount.id,
            type: 'file',
            name: fileName,
            version: version.id
        };

        self.createQuery(idOrPath, query, function (err, q) {
            
            if(err) return observer.onError(err);
            
            observer.onNext(q);
            observer.onCompleted();
        })
    });
}

function executeQuery(tx, newId) {
    
    return function(q) {
        
        return Rx.Observable.create(function(observer) {
            
            q.execWithin(tx, function(err) {
                
                if(err) return observer.onError(err);
                
                observer.onNext(newId);
                observer.onCompleted();
            });
        });
    }
}

function insertFile(tx) {
    
    return function(fileIdAndVersion) {
       
        var fileId    = fileIdAndVersion[0],
            versionId = fileIdAndVersion[1],
            insert = {
                fileId: fileId,
                versionId: versionId
            };
        return Rx.Observable.create(function(observer) {
            
            FileVersion.insert(insert)
                .execWithin(tx, function(err) {
                    
                    if(err) return observer.onError(err);
                    
                    observer.onNext(fileIdAndVersion);
                    observer.onCompleted();
                });
        });
    }
}

function updateFileVersion(tx) {
    
    return function(fileIdAndVersion) {
        
        var fileId    = fileIdAndVersion[0],
            versionId = fileIdAndVersion[1],
            file      = { id: fileId },
            version   = { version: versionId };
        
        return Rx.Observable.create(function(observer) {
            File
                .whereUpdate(file, version)
                .execWithin(tx, function(err) {
                    
                    if(err) return observer.onError(err);
                    
                    observer.onNext(tx);
                    observer.onCompleted();
                });
        });
    }
}

function commitDBAction(tx) {
    
    return Rx.Observable.create(function(observer) {
        
        // Not sure of the commit callback API, so
        // just pass whatever arguments back as the
        // next message and let the subscriber apply
        // them to the done callback.
        tx.commit(function() {
            observer.onNext(arguments);
            observer.onCompleted();
        });
    });
}
