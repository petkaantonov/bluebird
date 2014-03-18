    $ npm ls kew q when rsvp async bluebird deferred liar
    async-compare@0.1.0 c:\Users\Petka Antonov\bluebird\benchmark\async-compare
    ├── async@0.2.10
    ├── deferred@0.6.8
    ├── kew@0.3.4
    ├── liar@0.3.0
    ├── q@0.9.7
    ├── rsvp@3.0.6
    └── when@2.6.0

bench doxbee-sequential

    results for 10000 parallel executions, 1 ms per I/O op

    file                                 time(ms)  memory(MB)
    callbacks-baseline.js                     200       38.25
    promises-bluebird-generator.js            225       14.57
    promises-bluebird.js                      301       42.22
    callbacks-caolan-async-waterfall.js       652       80.34
    promises-obvious-kew.js                   864      131.16
    promises-tildeio-rsvp.js                 1081      279.96
    promises-medikoo-deferred.js             1764      309.75
    promises-dfilatov-vow.js                 2526      247.07
    promises-cujojs-when.js                  4111      294.35
    promises-calvinmetcalf-liar.js           4221      231.23
    promises-kriskowal-q.js                 35562      701.30

bench parallel (`--p 25`)

    results for 10000 parallel executions, 1 ms per I/O op

    file                                time(ms)  memory(MB)
    callbacks-baseline.js                    209       51.30
    promises-bluebird.js                     452      132.00
    promises-bluebird-generator.js           603      129.31
    callbacks-caolan-async-parallel.js      1022      197.93
    promises-obvious-kew.js                 2707      871.29
    promises-medikoo-deferred.js            3238      672.40
    promises-tildeio-rsvp.js                4516      730.60
    promises-calvinmetcalf-liar.js        142326     1357.04
    promises-cujojs-when.js                  OOM         OOM
    promises-kriskowal-q.js                  OOM         OOM

    Platform info:
    Linux 3.11.0-12-generic x64
    Node.JS 0.11.11
    V8 3.22.24.19
    Intel(R) Core(TM) i7-4900MQ CPU @ 2.80GHz × 8
