// Load all promise impls

module.exports = {
    when: require('../adapters/when.js'),
    q: require('../adapters/q.js'),
    avow: require('../adapters/avow.js'),
    rsvp: require('../adapters/rsvp.js'),
    jQuery: require('../adapters/jquery.js'),
    "bluebird": require('../adapters/bluebird.js'),
    "bluebird sync build": require('../adapters/bluebird_sync.js'),
};