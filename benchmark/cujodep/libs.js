// Load all promise impls

module.exports = {
    when: require('../adapters/when.js'),
    q: require('../adapters/q.js'),
    deferred: require('../adapters/deferred.js'), //fails spec
    "bluebird": require('../adapters/bluebird.js'),
    "bluebird sync build": require('../adapters/bluebird_sync.js'),
};