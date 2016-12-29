'use strict';

var regeneratorRuntime = typeof require === 'function' ? require('streamline-runtime/lib/callbacks/regenerator') : Streamline.require('streamline-runtime/lib/callbacks/regenerator');

var _streamline = typeof require === 'function' ? require('streamline-runtime/lib/callbacks/runtime') : Streamline.require('streamline-runtime/lib/callbacks/runtime');

var _filename = '/Users/bruno/dev/bluebird/benchmark/doxbee-sequential-errors/streamline._js';
require('../lib/fakes');

module.exports = _streamline.async(regeneratorRuntime.mark(function _$$upload$$(stream, idOrPath, tag, _2) {
    var blob, tx, blobId, file, previousId, version, splitPath, fileName, query;
    return regeneratorRuntime.wrap(function _$$upload$$$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    _context.prev = 0;
                    blob = blobManager.create(account);
                    tx = db.begin();
                    _context.next = 5;
                    return _streamline.await(_filename, 7, blob, 'put', 1, null, false, [stream, true]);

                case 5:
                    blobId = _context.sent;
                    _context.next = 8;
                    return _streamline.await(_filename, 8, self.byUuidOrPath(idOrPath), 'get', 0, null, false, [true]);

                case 8:
                    file = _context.sent;
                    previousId = file ? file.version : null;
                    version = {
                        userAccountId: userAccount.id,
                        date: new Date(),
                        blobId: blobId,
                        creatorId: userAccount.id,
                        previousId: previousId
                    };

                    version.id = Version.createHash(version);
                    _context.next = 14;
                    return _streamline.await(_filename, 19, Version.insert(version), 'execWithin', 1, null, false, [tx, true]);

                case 14:
                    triggerIntentionalError();

                    if (file) {
                            _context.next = 25;
                            break;
                        }

                    splitPath = idOrPath.split('/');
                    fileName = splitPath[splitPath.length - 1];

                    file = {
                        id: uuid.v1(),
                        userAccountId: userAccount.id,
                        name: fileName,
                        version: version.id
                    };
                    _context.next = 21;
                    return _streamline.await(_filename, 30, self, 'createQuery', 2, null, false, [idOrPath, file, true]);

                case 21:
                    query = _context.sent;
                    _context.next = 24;
                    return _streamline.await(_filename, 31, query, 'execWithin', 1, null, false, [tx, true]);

                case 24:
                    triggerIntentionalError();

                case 25:
                    _context.next = 27;
                    return _streamline.await(_filename, 34, FileVersion.insert({ fileId: file.id, versionId: version.id }), 'execWithin', 1, null, false, [tx, true]);

                case 27:
                    triggerIntentionalError();
                    _context.next = 30;
                    return _streamline.await(_filename, 37, File.whereUpdate({ id: file.id }, { version: version.id }), 'execWithin', 1, null, false, [tx, true]);

                case 30:
                    triggerIntentionalError();
                    tx.commit();
                    _context.next = 38;
                    break;

                case 34:
                    _context.prev = 34;
                    _context.t0 = _context['catch'](0);

                    tx.rollback();
                    throw _context.t0;

                case 38:
                case 'end':
                    return _context.stop();
            }
        }
    }, _$$upload$$, this, [[0, 34]]);
}), 3, 4);