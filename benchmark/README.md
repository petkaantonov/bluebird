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
    ├── when@3.6.4
    ├── rx@2.3.25
    ├── co@4.2.0
    ├── baconjs@0.7.43
    ├── highland@2.3.0

bench doxbee-sequential

results for 10000 parallel executions, 1 ms per I/O op

    file                                       time(ms)  memory(MB)
    callbacks-baseline.js                           158       31.64
    callbacks-suguru03-neo-async-waterfall.js       211       37.13
    promises-suguru03-aigle.js                      235       49.95
    promises-bluebird.js                            244       49.81
    promises-bluebird-generator.js                  246       41.18
    promises-cujojs-when.js                         356       64.14
    promises-lvivski-davy.js                        407       91.98
    promises-then-promise.js                        414       72.04
    promises-tildeio-rsvp.js                        437       82.75
    promises-native-async-await.js                  458       99.32
    promises-ecmascript6-native.js                  485       96.76
    generators-tj-co.js                             515       86.04
    callbacks-caolan-async-waterfall.js             643       80.82
    promises-dfilatov-vow.js                        766      138.96
    promises-obvious-kew.js                         826      101.72
    streamline-generators.js                        878       81.83
    promises-calvinmetcalf-lie.js                   956      107.17
    promises-medikoo-deferred.js                    956      118.96
    observables-pozadi-kefir.js                    1237      130.79
    streamline-callbacks.js                        1399      101.71
    observables-Reactive-Extensions-RxJS.js        2905      228.29
    promises-kriskowal-q.js                        8857      299.12
    observables-caolan-highland.js                10591      531.43
    observables-baconjs-bacon.js.js               30588      747.59

    Platform info:
    Darwin 17.3.0 x64
    Node.JS 8.9.4
    V8 6.1.534.50
    Intel(R) Core(TM) i7-7567U CPU @ 3.50GHz × 4

bench parallel (`--p 25`)

results for 10000 parallel executions, 1 ms per I/O op

    file                                      time(ms)  memory(MB)
    callbacks-baseline.js                          336       74.69
    callbacks-suguru03-neo-async-parallel.js       417       87.24
    promises-suguru03-aigle.js                     461      106.64
    promises-bluebird.js                           478      106.84
    promises-bluebird-generator.js                 521      108.04
    promises-lvivski-davy.js                       702      178.45
    callbacks-caolan-async-parallel.js             755      155.43
    promises-cujojs-when.js                        861      165.05
    promises-tildeio-rsvp.js                      1528      349.84
    promises-ecmascript6-native.js                1585      310.93
    promises-native-async-await.js                1737      318.35
    promises-medikoo-deferred.js                  1904      291.44
    promises-then-promise.js                      2182      314.76
    promises-calvinmetcalf-lie.js                 2577      378.43
    promises-obvious-kew.js                       2884      602.00
    promises-dfilatov-vow.js                      3583      544.10
    streamline-generators.js                     14805      888.93
    streamline-callbacks.js                      28102     1205.80

    Platform info:
    Darwin 17.3.0 x64
    Node.JS 8.9.4
    V8 6.1.534.50
    Intel(R) Core(TM) i7-7567U CPU @ 3.50GHz × 4
