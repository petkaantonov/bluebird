**2018-07-16** Latest results, using latest versions of modules:

    ├── async@2.6.1
    ├── davy@1.3.0
    ├── deferred@0.7.9
    ├── kew@0.7.0
    ├── lie@3.3.0
    ├── optimist@0.6.1
    ├── promise@8.0.1
    ├── q@1.5.1
    ├── rsvp@4.8.3
    ├── vow@0.4.17
    ├── when@3.7.8

bench doxbee-sequential `ls ./doxbee-sequential/*.js | sed -e 's|\.js||' | xargs node ./performance.js --p 1 --t 1 --n 10000`

    results for 10000 parallel executions, 1 ms per I/O op

    file                                    time(ms)  memory(MB)
    promises-bluebird-generator                  229       38.34
    callbacks-suguru03-neo-async-waterfall       253       47.13
    callbacks-baseline                           256       27.64
    promises-bluebird                            292       46.70
    promises-cujojs-when                         312       65.64
    callbacks-caolan-async-waterfall             361       47.55
    promises-ecmascript6-native                  434       97.04
    promises-then-promise                        436       68.77
    promises-tildeio-rsvp                        448       90.29
    generators-tj-co                             468       85.20
    promises-dfilatov-vow                        665      138.54
    promises-native-async-await                  671      110.64
    promises-obvious-kew                         736      105.14
    streamline-generators                        818       81.04
    promises-calvinmetcalf-lie                   862      155.03
    promises-lvivski-davy                        868       87.22
    observables-pozadi-kefir                    1234      139.05
    streamline-callbacks                        1366      100.46
    promises-medikoo-deferred                   1552       98.87
    observables-Reactive-Extensions-RxJS        2285      233.30
    promises-kriskowal-q                        8592      289.68
    observables-caolan-highland                12168      532.08
    observables-baconjs-bacon.js               33410      681.30

    Platform info:
    Darwin 17.7.0 x64
    Node.JS 8.11.1
    V8 6.2.414.50
    Intel(R) Core(TM) i5-7360U CPU @ 2.30GHz × 4

bench parallel (`--p 25`)

results for 10000 parallel executions, 1 ms per I/O op `ls ./madeup-parallel/*.js | sed -e 's|\.js||' | xargs node ./performance.js --p 25 --t 1 --n 10000`

    results for 10000 parallel executions, 1 ms per I/O op

    file                                   time(ms)  memory(MB)
    callbacks-baseline                          364       74.57
    callbacks-suguru03-neo-async-parallel       421       83.96
    promises-bluebird-generator                 490      108.12
    promises-bluebird                           504      107.77
    promises-lvivski-davy                       555      172.13
    callbacks-caolan-async-parallel             589      119.57
    promises-cujojs-when                       1145      165.89
    promises-native-async-await                1407      311.16
    promises-ecmascript6-native                1431      299.88
    promises-tildeio-rsvp                      1702      349.41
    promises-medikoo-deferred                  1818      280.08
    promises-then-promise                      2317      313.90
    promises-dfilatov-vow                      2783      531.71
    promises-obvious-kew                       2967      607.88
    promises-calvinmetcalf-lie                 3087      365.91

    Platform info:
    Darwin 17.7.0 x64
    Node.JS 8.11.1
    V8 6.2.414.50
    Intel(R) Core(TM) i5-7360U CPU @ 2.30GHz × 4
