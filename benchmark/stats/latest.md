    $ npm ls async deferred kew liar optimist q rsvp when vow davy bluebird
    async-compare@0.1.0 c:\Users\Petka Antonov\bluebird\benchmark\async-compare
    ├── davy@0.2.2
    ├── deferred@0.7.1
    ├── kew@0.4.0
    ├── liar@0.6.0
    ├── optimist@0.6.1
    ├── q@1.0.1
    ├── rsvp@3.0.6
    ├── vow@0.4.3
    └── when@3.1.0

bench doxbee-sequential

results for 10000 parallel executions, 1 ms per I/O op

    file                                 time(ms)  memory(MB)
    promises-bluebird-generator.js            185       17.57
    callbacks-baseline.js                     208       20.71
    promises-bluebird.js                      286       26.41
    promises-lvivski-davy.js                  569       54.44
    promises-dfilatov-vow.js                  674       80.83
    promises-cujojs-when.js                   750       69.09
    callbacks-caolan-async-waterfall.js       751       43.59
    promises-obvious-kew.js                  1106       84.92
    promises-tildeio-rsvp.js                 1219      142.54
    promises-ecmascript6-native.js           1289       80.89
    promises-medikoo-deferred.js             2293      149.17
    promises-calvinmetcalf-liar.js           5086      179.60
    promises-kriskowal-q.js                 19876      420.27

    Platform info:
    Windows_NT 6.1.7601 ia32
    Node.JS 0.11.13
    V8 3.25.30
    Intel(R) Core(TM) i5-2500K CPU @ 3.30GHz × 4

bench parallel (`--p 25`)

    results for 10000 parallel executions, 1 ms per I/O op

    file                                time(ms)  memory(MB)
    promises-bluebird.js                     506       63.55
    promises-bluebird-generator.js           564       63.87
    callbacks-baseline.js                    566       25.54
    promises-lvivski-davy.js                1094      129.52
    promises-cujojs-when.js                 1573      178.39
    callbacks-caolan-async-parallel.js      1644       99.84
    promises-dfilatov-vow.js                1750      194.39
    promises-tildeio-rsvp.js                3767      464.02
    promises-obvious-kew.js                 3835      364.74
    promises-medikoo-deferred.js            4552      356.34
    promises-ecmascript6-native.js          4697      313.50

    Platform info:
    Windows_NT 6.1.7601 ia32
    Node.JS 0.11.13
    V8 3.25.30
    Intel(R) Core(TM) i5-2500K CPU @ 3.30GHz × 4
