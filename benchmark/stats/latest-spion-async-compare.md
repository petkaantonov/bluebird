    $ npm ls kew q when rsvp async bluebird
    async-compare@0.1.0 c:\Users\Petka Antonov\bluebird\benchmark\async-compare
    ├── async@0.2.9
    ├── bluebird@0.9.10-1
    ├── kew@0.3.0
    ├── q@0.9.7
    ├── rsvp@2.0.4
    └── when@2.6.0

    results for 10000 parallel executions, 1 ms per I/O op

    file                                 time(ms)  memory(MB)
    callbacks-baseline.js                     172       35.10
    promises-bluebird-generator.js            234       39.98
    promises-bluebird.js                      374       56.70
    callbacks-caolan-async-waterfall.js       687       76.50
    promises-obvious-kew.js                  1123      122.36
    promises-cujojs-when.js                  4899      289.62
    promises-tildeio-rsvp.js                 6630      357.94
    promises-kriskowal-q.js                 24695      717.38

    Platform info:
    Windows_NT 6.1.7601 x64
    Node.JS 0.11.8
    V8 3.21.18.3
    Intel(R) Core(TM) i5-2500K CPU @ 3.30GHz × 4
