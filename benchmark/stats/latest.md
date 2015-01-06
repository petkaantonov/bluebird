    ├── async@0.9.0
    ├── davy@0.3.3
    ├── deferred@0.7.1
    ├── kew@0.5.0-alpha.1
    ├── lie@2.8.0
    ├── optimist@0.6.1
    ├── promise@6.0.1
    ├── q@1.1.2
    ├── rsvp@3.0.16
    ├── vow@0.4.7
    └── when@3.6.4

bench doxbee-sequential

    results for 10000 parallel executions, 1 ms per I/O op

    file                                 time(ms)  memory(MB)
    callbacks-baseline.js                     191       19.63
    promises-bluebird-generator.js            201       19.45
    promises-bluebird.js                      339       29.64
    promises-tildeio-rsvp.js                  402       43.38
    promises-cujojs-when.js                   404       33.25
    promises-dfilatov-vow.js                  507       60.30
    promises-lvivski-davy.js                  596       57.84
    callbacks-caolan-async-waterfall.js       679       45.46
    promises-calvinmetcalf-lie.js             685       65.23
    promises-ecmascript6-native.js           1426      103.78
    promises-obvious-kew.js                  1563      104.78
    promises-then-promise.js                 1565      107.13
    promises-medikoo-deferred.js             2271      137.44
    promises-kriskowal-q.js                 20496      439.68

    Platform info:
    Windows_NT 6.1.7601 ia32
    Node.JS 0.11.14
    V8 3.26.33
    Intel(R) Core(TM) i5-2500K CPU @ 3.30GHz × 4

bench parallel (`--p 25`)

results for 10000 parallel executions, 1 ms per I/O op

    file                                time(ms)  memory(MB)
    callbacks-baseline.js                    211       25.57
    promises-bluebird.js                     389       53.49
    promises-bluebird-generator.js           491       55.52
    promises-tildeio-rsvp.js                 785      108.14
    promises-dfilatov-vow.js                 798      102.08
    promises-cujojs-when.js                  851       60.46
    promises-calvinmetcalf-lie.js           1065      187.69
    promises-lvivski-davy.js                1298      135.43
    callbacks-caolan-async-parallel.js      1780      101.11
    promises-then-promise.js                2438      338.91
    promises-ecmascript6-native.js          3532      301.96
    promises-medikoo-deferred.js            4207      357.60
    promises-obvious-kew.js                 8311      559.24

    Platform info:
    Windows_NT 6.1.7601 ia32
    Node.JS 0.11.14
    V8 3.26.33
    Intel(R) Core(TM) i5-2500K CPU @ 3.30GHz × 4
