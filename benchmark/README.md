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

    file                                    time(ms)  memory(MB)
    callbacks-baseline                           162       28.12
    callbacks-suguru03-neo-async-waterfall       195       42.39
    promises-bluebird-generator                  199       40.23
    callbacks-caolan-async-waterfall             225       46.36
    promises-native-async-await                  245       57.39
    promises-bluebird                            257       47.03
    promises-lvivski-davy                        313       87.59
    promises-cujojs-when                         318       64.34
    promises-then-promise                        323       64.49
    generators-tj-co                             334       58.03
    promises-ecmascript6-native                  335       65.40
    promises-tildeio-rsvp                        420       86.79
    promises-calvinmetcalf-lie                   514      138.58
    promises-dfilatov-vow                        629      135.28
    promises-obvious-kew                         693      190.43
    streamline-generators                        762       90.18
    promises-medikoo-deferred                    781      149.33
    observables-pozadi-kefir                     824      180.54
    streamline-callbacks                        1088      114.73
    observables-Reactive-Extensions-RxJS        1208      243.74
    observables-caolan-highland                 3094      424.63
    promises-kriskowal-q                        3505      367.13
    observables-baconjs-bacon.js                5224      660.07

    Platform info:
    Darwin 17.7.0 x64
    Node.JS 10.6.0
    V8 6.7.288.46-node.13
    Intel(R) Core(TM) i5-7360U CPU @ 2.30GHz × 4

bench parallel (`--p 25`)

results for 10000 parallel executions, 1 ms per I/O op `ls ./madeup-parallel/*.js | sed -e 's|\.js||' | xargs node ./performance.js --p 25 --t 1 --n 10000`

    results for 10000 parallel executions, 1 ms per I/O op

    file                                   time(ms)  memory(MB)
    callbacks-baseline                          309       74.47
    callbacks-suguru03-neo-async-parallel       374       84.18
    promises-bluebird-generator                 455      106.49
    promises-bluebird                           472       98.00
    callbacks-caolan-async-parallel             510      119.34
    promises-lvivski-davy                       671      163.84
    promises-cujojs-when                        701      168.99
    promises-native-async-await                1087      242.02
    promises-tildeio-rsvp                      1237      344.17
    promises-calvinmetcalf-lie                 1401      370.65
    promises-ecmascript6-native                1509      242.91
    promises-then-promise                      1533      303.89
    promises-medikoo-deferred                  1923      334.75
    promises-dfilatov-vow                      2534      534.80
    promises-obvious-kew                       2623      306.68

    Platform info:
    Darwin 17.7.0 x64
    Node.JS 10.6.0
    V8 6.7.288.46-node.13
    Intel(R) Core(TM) i5-7360U CPU @ 2.30GHz × 4
