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

    results for 10000 parallel executions, 1 ms per I/O op

    file                                 time(ms)  memory(MB)
    callbacks-baseline.js                     156       34.59
    promises-bluebird-generator.js            203       38.53
    promises-bluebird.js                      375       56.79
    callbacks-caolan-async-waterfall.js       609       74.71
    promises-obvious-kew.js                  1061      106.02
    promises-medikoo-deferred.js             2434      337.29
    promises-calvinmetcalf-liar.js           2527      279.33
    promises-cujojs-when.js                  5008      294.05
    promises-tildeio-rsvp.js                 6692      502.84
    promises-kriskowal-q.js                 23837      717.39

    Platform info:
    Windows_NT 6.1.7601 x64
    Node.JS 0.11.8
    V8 3.21.18.3
    Intel(R) Core(TM) i5-2500K CPU @ 3.30GHz × 4
