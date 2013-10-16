// Load all promise impls

module.exports = {
    when: require('../adapters/when.js'),
    q: require('../adapters/q.js'),
    //kew: require('../adapters/kew.js'),
    avow: require('../adapters/avow.js'),
    rsvp: require('../adapters/rsvp.js'),
    deferred: require('../adapters/deferred.js'), //fails spec
    bluebird: require('../adapters/bluebird.js'),
    "bluebird sync build": require('../adapters/bluebird_sync.js'),
    concurrent: require('../adapters/concurrent.js')
};
