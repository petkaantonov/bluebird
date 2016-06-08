**2015-01-05** Latest results, using latest versions of modules:

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
    ├── rx@2.3.25
    ├── co@4.2.0
    ├── baconjs@0.7.43
    ├── highland@2.3.0

bench doxbee-sequential

    results for 10000 parallel executions, 1 ms per I/O op

    file                                     time(ms)  memory(MB)
    callbacks-baseline.js                         232       35.86
    promises-bluebird-generator.js                235       38.04
    promises-bluebird.js                          335       52.08
    promises-cujojs-when.js                       405       75.77
    promises-tildeio-rsvp.js                      468       87.56
    promises-dfilatov-vow.js                      578      125.98
    callbacks-caolan-async-waterfall.js           634       88.64
    promises-lvivski-davy.js                      653      109.64
    promises-calvinmetcalf-lie.js                 732      165.41
    promises-obvious-kew.js                      1346      261.69
    promises-ecmascript6-native.js               1348      189.29
    generators-tj-co.js                          1419      164.03
    promises-then-promise.js                     1571      294.45
    promises-medikoo-deferred.js                 2091      262.18
    observables-Reactive-Extensions-RxJS.js      3201      356.76
    observables-caolan-highland.js               7429      616.78
    promises-kriskowal-q.js                      9952      694.23
    observables-baconjs-bacon.js.js             25805      885.55

    Platform info:
    Windows_NT 6.1.7601 x64
    Node.JS 1.1.0
    V8 4.1.0.14
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
