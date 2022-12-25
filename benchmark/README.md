**2018-10-25** Latest results, using latest versions of modules:

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

```
results for 10000 parallel executions, 1 ms per I/O op

file                                    time(ms)  memory(MB)
callbacks-baseline                           174       25.95
callbacks-suguru03-neo-async-waterfall       199       41.78
promises-bluebird-generator                  209       37.74
callbacks-caolan-async-waterfall             244       44.87
promises-bluebird                            257       46.92
promises-native-async-await                  267       66.71
promises-lvivski-davy                        281       86.89
promises-cujojs-when                         287       63.08
promises-then-promise                        318       63.08
promises-ecmascript6-native                  325       78.17
generators-tj-co                             336       61.55
promises-tildeio-rsvp                        377       79.04
promises-calvinmetcalf-lie                   410      126.13
promises-dfilatov-vow                        601      130.13
observables-pozadi-kefir                     678      154.31
promises-obvious-kew                         742      108.07
promises-medikoo-deferred                    748      132.32
streamline-generators                        762       91.52
observables-Reactive-Extensions-RxJS         925      237.50
streamline-callbacks                        1036      108.14
promises-kriskowal-q                        2351      251.68
observables-caolan-highland                 2914      462.32
observables-baconjs-bacon.js                4895      672.91

Platform info:
Linux 4.18.0-8-generic x64
Node.JS 10.12.0
V8 6.8.275.32-node.35
Intel(R) Core(TM) i7-6700HQ CPU @ 2.60GHz × 8
```

bench parallel (`--p 25`)

results for 10000 parallel executions, 1 ms per I/O op `ls ./madeup-parallel/*.js | sed -e 's|\.js||' | xargs node ./performance.js --p 25 --t 1 --n 10000`

```
results for 10000 parallel executions, 1 ms per I/O op

file                                   time(ms)  memory(MB)
callbacks-baseline                          263       72.20
callbacks-suguru03-neo-async-parallel       365       87.33
promises-lvivski-davy                       416      156.54
promises-bluebird                           417       95.94
promises-bluebird-generator                 474      105.20
promises-cujojs-when                        480      168.63
callbacks-caolan-async-parallel             484      113.35
promises-native-async-await                 691      230.16
promises-ecmascript6-native                 816      224.61
promises-tildeio-rsvp                       985      335.68
promises-calvinmetcalf-lie                 1242      368.93
promises-then-promise                      1273      288.39
promises-medikoo-deferred                  1342      317.04
promises-dfilatov-vow                      2095      533.83
promises-obvious-kew                       2758      531.72
streamline-generators                      6732      779.98
streamline-callbacks                       9912     1157.42

Platform info:
Linux 4.18.0-8-generic x64
Node.JS 10.12.0
V8 6.8.275.32-node.35
Intel(R) Core(TM) i7-6700HQ CPU @ 2.60GHz × 8
```
