    $ npm ls async deferred kew lie promise optimist q rsvp when vow davy bluebird
    async-compare@0.1.1 /Users/cmetcalf/projects/bluebird/benchmark
    ├── async@0.7.0
    ├── davy@0.2.3
    ├── deferred@0.7.1
    ├── kew@0.4.0
    ├── lie@2.7.3
    ├── optimist@0.6.1
    ├── promise@5.0.0
    ├── q@1.0.1
    ├── rsvp@3.0.6
    ├── vow@0.4.3
    └── when@3.1.0

./bench doxbee

results for 10000 parallel executions, 1 ms per I/O op

    file                                 time(ms)  memory(MB)
    callbacks-baseline.js                     295       38.76
    promises-bluebird-generator.js            326       40.11
    promises-bluebird.js                      385       51.95
    promises-lvivski-davy.js                  814       96.05
    promises-cujojs-when.js                   879      110.01
    promises-dfilatov-vow.js                  907      146.59
    callbacks-caolan-async-waterfall.js      1205       68.85
    promises-obvious-kew.js                  1415      138.72
    promises-ecmascript6-native.js           1533      177.40
    promises-tildeio-rsvp.js                 1613      220.22
    promises-then-promise.js                 1755      240.07
    promises-calvinmetcalf-lie.js            2922      172.87
    promises-medikoo-deferred.js             3194      293.63
    promises-kriskowal-q.js                 18456      526.07

    Platform info:
    Darwin 13.1.0 x64
    Node.JS 0.11.13
    V8 3.25.30
    Intel(R) Core(TM) i7-3615QM CPU @ 2.30GHz × 8

./bench parallel (`--p 25`)

results for 10000 parallel executions, 1 ms per I/O op

    file                                time(ms)  memory(MB)
    callbacks-baseline.js                    296       45.48
    promises-bluebird.js                     769      125.85
    promises-bluebird-generator.js           929      129.68
    promises-lvivski-davy.js                1608      255.09
    callbacks-caolan-async-parallel.js      1741      221.64
    promises-cujojs-when.js                 2079      321.07
    promises-dfilatov-vow.js                2390      356.13
    promises-calvinmetcalf-lie.js           2561      470.17
    promises-tildeio-rsvp.js                4671      985.05
    promises-then-promise.js                4692      669.98
    promises-obvious-kew.js                 5000      495.68
    promises-ecmascript6-native.js          6043      530.02
    promises-medikoo-deferred.js            6472      699.10

    Platform info:
    Darwin 13.1.0 x64
    Node.JS 0.11.13
    V8 3.25.30
    Intel(R) Core(TM) i7-3615QM CPU @ 2.30GHz × 8
