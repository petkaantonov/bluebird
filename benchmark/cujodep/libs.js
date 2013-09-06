// Load all promise impls

module.exports = {
    when: require('../adapters/when.js'),
    q: require('../adapters/q.js'),
    deferred: require('../adapters/deferred.js'), //fails spec
    Esailija: require('../adapters/promise.js'),
    "Esailija-sync": require('../adapters/promise_sync.js'),
};