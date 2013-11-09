    $ npm ls kew q when rsvp async bluebird deferred
    async-compare@0.1.0 c:\Users\Petka Antonov\bluebird\benchmark\async-compare
    ├── async@0.2.9
    ├── bluebird@0.9.10-1
    ├── deferred@0.6.6
    ├── kew@0.3.0
    ├── q@0.9.7
    ├── rsvp@2.0.4
    └── when@2.6.0

    results for 10000 parallel executions, 1 ms per I/O op

    file                                 time(ms)  memory(MB)
    callbacks-baseline.js                     172       35.23
    promises-bluebird-generator.js            218       38.39
    promises-bluebird.js                      421       58.43
    callbacks-caolan-async-waterfall.js       639       76.95
    promises-obvious-kew.js                  1154      139.08
    promises-medikoo-deferred.js             2574      335.59
    promises-cujojs-when.js                  5101      290.52
    promises-tildeio-rsvp.js                 6848      395.65
    promises-kriskowal-q.js                 24664      716.84

    Platform info:
    Windows_NT 6.1.7601 x64
    Node.JS 0.11.8
    V8 3.21.18.3
    Intel(R) Core(TM) i5-2500K CPU @ 3.30GHz × 4
