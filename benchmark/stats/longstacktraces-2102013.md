#Long stack traces enabled for bluebird, after smart stack tracing patch

    results for 10000 parallel executions, 1 ms per I/O op

    file                         time(ms)  memory(MB)
    flattened-class-ctx.js             60       16.23
    flattened-class.js                125       28.19
    flattened-noclosure.js            147       30.81
    original.js                       163       34.55
    flattened.js                      167       35.18
    catcher.js                        193       30.61
    suspend.js                        248       43.40
    dst-streamline.js                 263       43.32
    gens.js                           350       40.30
    co.js                             505       47.69
    genny.js                          510       67.96
    async.js                          676       71.09
    dst-co-traceur.js                 720       52.87
    dst-genny-traceur.js              737       56.05
    dst-suspend-traceur.js            872       51.66
    bluebirdCoroutine.js             1173      119.30
    rx.js                            1641      267.55
    dst-stratifiedjs-014.js          1669      149.46
    promiseishBluebird.js            1717      168.33
    bluebirdSpawn.js                 1966      145.50
    promises-composeBluebird.js      2089      190.96
    promiseish.js                    6492      732.92
    qasync.js                       14186      534.88
    dst-qasync-traceur.js           18235      573.11
    promiseishQ.js                  24258      714.87
    promises-compose.js             56397      896.03
    promises.js                       N/A         N/A
    dst-streamline-fibers.js          N/A         N/A
    fibrous.js                        N/A         N/A