    ├── async@0.7.0
    ├── davy@0.2.2
    ├── deferred@0.7.1
    ├── kew@0.4.0
    ├── lie@2.7.3
    ├── promise@5.0.0
    ├── q@1.0.1
    ├── rsvp@3.0.6
    ├── vow@0.4.3
    └── when@3.1.0

bench doxbee-sequential

results for 10000 parallel executions, 1 ms per I/O op

    file                                 time(ms)  memory(MB)
    promises-bluebird-generator.js            171       16.52
    callbacks-baseline.js                     197       20.68
    promises-bluebird.js                      280       26.64
    promises-lvivski-davy.js                  616       58.75
    promises-dfilatov-vow.js                  672       80.59
    promises-cujojs-when.js                   731       68.74
    callbacks-caolan-async-waterfall.js       733       44.57
    promises-calvinmetcalf-lie.js            1035      113.07
    promises-obvious-kew.js                  1047       78.50
    promises-tildeio-rsvp.js                 1121      109.49
    promises-ecmascript6-native.js           1298       96.05
    promises-then-promise.js                 1775      134.73
    promises-medikoo-deferred.js             2238      149.61
    promises-kriskowal-q.js                 19786      415.04

    Platform info:
    Windows_NT 6.1.7601 ia32
    Node.JS 0.11.13
    V8 3.25.30
    Intel(R) Core(TM) i5-2500K CPU @ 3.30GHz × 4

bench parallel (`--p 25`)

    results for 10000 parallel executions, 1 ms per I/O op

    file                                time(ms)  memory(MB)
    promises-bluebird.js                     483       63.32
    callbacks-baseline.js                    545       25.54
    promises-bluebird-generator.js           574       64.66
    promises-lvivski-davy.js                1088      128.62
    promises-cujojs-when.js                 1527      178.57
    callbacks-caolan-async-parallel.js      1635       99.87
    promises-dfilatov-vow.js                1753      196.96
    promises-then-promise.js                2553      338.36
    promises-ecmascript6-native.js          3749      309.55
    promises-obvious-kew.js                 3805      366.32
    promises-tildeio-rsvp.js                3916      462.23
    promises-calvinmetcalf-lie.js           4477      230.99
    promises-medikoo-deferred.js            4613      356.03

    Platform info:
    Windows_NT 6.1.7601 ia32
    Node.JS 0.11.13
    V8 3.25.30
    Intel(R) Core(TM) i5-2500K CPU @ 3.30GHz × 4
