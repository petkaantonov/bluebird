'use strict';

var _streamline = typeof require === 'function' ? require('streamline-runtime/lib/generators/runtime') : Streamline.require('streamline-runtime/lib/generators/runtime');

var _filename = '/Users/bruno/dev/bluebird/benchmark/doxbee-sequential/streamline._js';
require('../lib/fakes');

module.exports = _streamline.async(function* _$$upload$$(stream, idOrPath, tag, _2) {
    {
        try {
            var blob = blobManager.create(account);
            var tx = db.begin();
            var blobId = yield _streamline.await(_filename, 7, blob, 'put', 1, null, false, [stream, true]);
            var file = yield _streamline.await(_filename, 8, self.byUuidOrPath(idOrPath), 'get', 0, null, false, [true]);

            var previousId = file ? file.version : null;
            var version = {
                userAccountId: userAccount.id,
                date: new Date(),
                blobId: blobId,
                creatorId: userAccount.id,
                previousId: previousId
            };
            version.id = Version.createHash(version);
            yield _streamline.await(_filename, 19, Version.insert(version), 'execWithin', 1, null, false, [tx, true]);
            if (!file) {
                    var splitPath = idOrPath.split('/');
                    var fileName = splitPath[splitPath.length - 1];
                    file = {
                        id: uuid.v1(),
                        userAccountId: userAccount.id,
                        name: fileName,
                        version: version.id
                    };
                    var query = yield _streamline.await(_filename, 29, self, 'createQuery', 2, null, false, [idOrPath, file, true]);
                    yield _streamline.await(_filename, 30, query, 'execWithin', 1, null, false, [tx, true]);
                }
            yield _streamline.await(_filename, 32, FileVersion.insert({ fileId: file.id, versionId: version.id }), 'execWithin', 1, null, false, [tx, true]);
            yield _streamline.await(_filename, 34, File.whereUpdate({ id: file.id }, { version: version.id }), 'execWithin', 1, null, false, [tx, true]);
            tx.commit();
        } catch (err) {
            tx.rollback();
            throw err;
        }
    }
}, 3, 4);