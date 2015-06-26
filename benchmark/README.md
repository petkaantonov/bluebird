# Benchmarks

## 2015-06-26 (bluebird@2.9.30)

    ├── async@0.9.2
    ├── baconjs@0.7.65
    ├── co@4.5.4
    ├── davy@0.3.8
    ├── deferred@0.7.2
    ├── highland@2.5.1
    ├── kew@0.5.0
    ├── lie@2.9.1
    ├── optimist@0.6.1
    ├── promise@6.1.0
    ├── q@1.4.1
    ├── rsvp@3.0.18
    ├── rx@2.5.3
    ├── vow@0.4.10
    └── when@3.7.3

### bench doxbee

    file                                     time(ms)  memory(MB)
    callbacks-baseline.js                         171       33.40
    promises-bluebird-generator.js                183       29.02
    promises-bluebird.js                          261       50.13
    promises-cujojs-when.js                       329       64.99
    promises-tildeio-rsvp.js                      382       72.80
    callbacks-caolan-async-waterfall.js           444       76.89
    promises-lvivski-davy.js                      510      111.60
    promises-dfilatov-vow.js                      533      136.42
    promises-calvinmetcalf-lie.js                 580      161.37
    promises-ecmascript6-native.js                781      187.07
    generators-tj-co.js                           796      161.56
    promises-obvious-kew.js                      1044      255.21
    promises-then-promise.js                     1225      235.82
    promises-medikoo-deferred.js                 1692      257.82
    observables-Reactive-Extensions-RxJS.js      2424      285.63
    observables-pozadi-kefir.js                  3142      191.35
    promises-kriskowal-q.js                      6804      728.61
    observables-caolan-highland.js               7055      560.95
    observables-baconjs-bacon.js.js             17431      836.14

    Platform info:
    Darwin 14.3.0 x64
    Node.JS 2.3.1
    V8 4.2.77.20
    Intel(R) Core(TM) i7-4960HQ CPU @ 2.60GHz × 8

### bench parallel

    file                                time(ms)  memory(MB)
    callbacks-baseline.js                    144       37.70
    promises-bluebird.js                     368      110.25
    promises-bluebird-generator.js           400      110.57
    promises-cujojs-when.js                  586      165.23
    promises-tildeio-rsvp.js                 626      214.14
    callbacks-caolan-async-parallel.js       894      224.36
    promises-lvivski-davy.js                1072      274.20
    promises-calvinmetcalf-lie.js           1151      371.40
    promises-dfilatov-vow.js                1880      525.17
    promises-ecmascript6-native.js          1901      533.11
    promises-then-promise.js                2177      678.41
    promises-medikoo-deferred.js            3254      393.89
    promises-obvious-kew.js                 4372      961.61

    Platform info:
    Darwin 14.3.0 x64
    Node.JS 2.3.1
    V8 4.2.77.20
    Intel(R) Core(TM) i7-4960HQ CPU @ 2.60GHz × 8

## 2015-01-05

    ├── async@0.9.0
    ├── baconjs@0.7.43
    ├── co@4.2.0
    ├── davy@0.3.3
    ├── deferred@0.7.1
    ├── highland@2.3.0
    ├── kew@0.5.0-alpha.1
    ├── lie@2.8.0
    ├── optimist@0.6.1
    ├── promise@6.0.1
    ├── q@1.1.2
    ├── rsvp@3.0.16
    ├── rx@2.3.25
    ├── vow@0.4.7
    └── when@3.6.4

### bench doxbee-sequential

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

### bench parallel

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
