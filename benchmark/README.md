**2020-07-10** Latest results, using latest versions of modules and the fixed benchmark tool:

    ├── async@3.2.0
    ├── davy@1.3.0
    ├── deferred@0.7.11
    ├── kew@0.7.0
    ├── lie@3.3.0
    ├── optimist@0.6.1
    ├── promise@8.1.0
    ├── q@1.5.1
    ├── streamline@3.0.0
    ├── streamline-runtime@2.0.1
    ├── rsvp@4.8.5
    ├── vow@0.4.20
    ├── when@3.7.8

## Sequential benchmark

bench doxbee-sequential `ls ./doxbee-sequential/*.js | sed -e 's|\.js||' | xargs node ./performance.js --p 1 --t 1 --n 10000`

    file                                    time(ms)  memory(MB)
    callbacks-baseline                           125       24.33
    callbacks-suguru03-neo-async-waterfall       171       41.83
    callbacks-caolan-async-waterfall             180       46.10
    promises-native-async-await                  228       50.30
    promises-bluebird-generator                  229       34.67
    promises-lvivski-davy                        259       90.27
    promises-bluebird                            273       47.95
    generators-tj-co                             309       58.47
    promises-ecmascript6-native                  323       64.30
    promises-then-promise                        337       72.52
    promises-cujojs-when                         349       61.88
    promises-tildeio-rsvp                        423       84.26
    promises-calvinmetcalf-lie                   559      127.08
    promises-dfilatov-vow                        569      137.19
    promises-obvious-kew                         687      126.44
    observables-pozadi-kefir                     734      134.27
    streamline-generators                        736       75.25
    promises-medikoo-deferred                    785      124.33
    observables-Reactive-Extensions-RxJS         958      236.98
    streamline-callbacks                        1097      106.21
    promises-kriskowal-q                        2459      535.71
    observables-caolan-highland                 2567      549.15
    observables-baconjs-bacon.js                3894      762.46

    Platform info:
    Linux 5.4.44-1-MANJARO x64
    Node.JS 14.2.0
    V8 8.1.307.31-node.33
    Intel(R) Core(TM) i5-6300U CPU @ 2.40GHz × 4


## Parallel benchmark

bench parallel (`--p 25`)

results for 10000 parallel executions, 1 ms per I/O op `ls ./madeup-parallel/*.js | sed -e 's|\.js||' | xargs node ./performance.js --p 25 --t 1 --n 10000`

    results for 10000 parallel executions, 1 ms per I/O op

    file                                   time(ms)  memory(MB)
    callbacks-baseline                          266       81.63
    callbacks-suguru03-neo-async-parallel       338       84.65
    callbacks-caolan-async-parallel             449      113.75
    promises-lvivski-davy                       461      157.35
    promises-bluebird-generator                 488       93.39
    promises-bluebird                           523      103.17
    promises-cujojs-when                        638      153.63
    promises-ecmascript6-native                 850      212.47
    promises-native-async-await                 909      208.11
    promises-then-promise                       945      231.95
    generators-tj-co                            971      222.68
    promises-tildeio-rsvp                       982      309.17
    promises-calvinmetcalf-lie                  991      325.19
    promises-medikoo-deferred                  1630      354.50
    promises-dfilatov-vow                      1838      474.54
    promises-obvious-kew                       1971      598.67
    streamline-generators                      5382      858.13
    streamline-callbacks                       8164     1089.96

    Platform info:
    Linux 5.4.44-1-MANJARO x64
    Node.JS 14.2.0
    V8 8.1.307.31-node.33
    Intel(R) Core(TM) i5-6300U CPU @ 2.40GHz × 4

