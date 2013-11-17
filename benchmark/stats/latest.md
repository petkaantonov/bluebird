    $ npm ls kew q when rsvp async bluebird deferred liar
    async-compare@0.1.0 c:\Users\Petka Antonov\bluebird\benchmark\async-compare
    ├── async@0.2.9
    ├── bluebird@0.9.10-1
    ├── deferred@0.6.6
    ├── kew@0.3.0
    ├── liar@0.3.0
    ├── q@0.9.7
    ├── rsvp@2.0.4
    └── when@2.6.0

bench doxbee-sequential

    results for 10000 parallel executions, 1 ms per I/O op

    file                                 time(ms)  memory(MB)
    callbacks-baseline.js                     172       34.69
    promises-bluebird-generator.js            234       39.63
    promises-bluebird.js                      312       48.68
    callbacks-caolan-async-waterfall.js       609       75.96
    promises-obvious-kew.js                  1061      120.68
    promises-medikoo-deferred.js             2434      337.46
    promises-calvinmetcalf-liar.js           2605      343.23
    promises-cujojs-when.js                  4820      285.99
    promises-tildeio-rsvp.js                 6536      301.55
    promises-kriskowal-q.js                 23322      713.96

bench parallel (`--p 15`)

    results for 10000 parallel executions, 1 ms per I/O op

    file                                time(ms)  memory(MB)
    callbacks-baseline.js                    406       29.43
    promises-bluebird-generator.js           421       90.12
    promises-bluebird.js                     421       98.18
    callbacks-caolan-async-parallel.js       764      151.31
    promises-obvious-kew.js                 2075      542.27
    promises-calvinmetcalf-liar.js          2886      453.70
    promises-medikoo-deferred.js            2933      434.21
    promises-cujojs-when.js                 6427     1229.53
    promises-tildeio-rsvp.js               11169     1359.55
    promises-kriskowal-q.js                  OOM         OOM

    Platform info:
    Windows_NT 6.1.7601 x64
    Node.JS 0.11.8
    V8 3.21.18.3
    Intel(R) Core(TM) i5-2500K CPU @ 3.30GHz × 4
