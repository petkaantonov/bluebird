#Long stack traces enabled for bluebird, after another performance patch for stack traces

    results for 10000 parallel executions, 1 ms per I/O op

    file                         time(ms)  memory(MB)
    flattened-class-ctx.js             59       16.10
    flattened-class.js                125       29.02
    flattened-noclosure.js            140       30.67
    original.js                       163       34.58
    flattened.js                      172       35.18
    catcher.js                        203       30.77
    suspend.js                        246       42.71
    dst-streamline.js                 258       43.33
    gens.js                           349       40.32
    genny.js                          485       66.32
    co.js                             503       47.67
    async.js                          641       70.25
    dst-co-traceur.js                 737       55.12
    dst-suspend-traceur.js            784       53.71
    dst-genny-traceur.js              899       73.75
    bluebirdCoroutine.js             1168      115.61
    promiseishBluebird.js            1450      117.24
    dst-stratifiedjs-014.js          1634      149.57
    rx.js                            1692      267.63
    promises-composeBluebird.js      1907      168.07
    bluebirdSpawn.js                 1971      137.04
    promiseish.js                    6580      311.97
    dst-qasync-traceur.js           13079      591.44
    qasync.js                       15866      792.92
    promiseishQ.js                  24285      718.06
    promises-compose.js             54123      791.84
    promises.js                       N/A         N/A
    dst-streamline-fibers.js          N/A         N/A
    fibrous.js                        N/A         N/A