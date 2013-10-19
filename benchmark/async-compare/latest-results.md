Date: 2013-10-07

# Performance

```

results for 10000 parallel executions, 1 ms per I/O op

file                                        time(ms)  memory(MB)
callbacks-flattened-class-ctx.js                 178       16.35
promises-bluebird-generator-ctx.js               238       19.25
callbacks-flattened-class.js                     288       28.23
callbacks-flattened-passing.js                   289       34.22
promises-bluebird-ctx.js                         312       40.05
callbacks-flattened.js                           316       35.09
callbacks-original.js                            317       34.97
callbacks-catcher.js                             367       30.50
promises-bluebird-generator.js                   377       41.95
callbacks-generator-suspend.js                   408       44.76
callbacks-deferred-queue.js                      461       38.08
dst-streamline.js                                464       46.91
promises-bluebird.js                             528       57.33
thunks-generator-gens.js                         536       40.53
thunks-generator-co.js                           714       48.06
promises-compose-bluebird.js                     727       72.89
callbacks-generator-genny.js                     816       67.71
callbacks-async-waterfall.js                     870       70.62
dst-callbacks-generator-genny-traceur.js        1024       55.45
dst-thunks-generator-co-traceur.js              1102       55.34
dst-callbacks-generator-suspend-traceur.js      1127       53.37
promises-bluebird-spawn.js                      1275       68.53
promises-kew.js                                 1596      104.14
dst-stratifiedjs-compiled.js                    2400      148.38
rx.js                                           2435      266.50
promises-when.js                                8475      254.25
dst-promises-q-generator-traceur.js            16261      611.07
promises-q-generator.js                        26577      893.51
promises-q.js                                  28708      712.84
promises-compose-q.js                          60848      810.35
```

# Debuggability (throw)

```
file                                        actual-line  rep-line  distance  crashed
callbacks-catcher.js                                 39        39         0       no
callbacks-generator-genny.js                         34        34         0       no
callbacks-generator-suspend.js                       34        34         0       no
dst-stratifiedjs-compiled.js                         39        39         0       no
promises-bluebird-generator.js                       36        36         0       no
promises-bluebird-spawn.js                           37        37         0       no
promises-bluebird.js                                 48        48         0       no
promises-compose-bluebird.js                         61        61         0       no
promises-kew.js                                      49        49         0       no
promises-q-generator.js                              35        35         0       no
promises-q.js                                        48        48         0       no
dst-streamline.js                                    35        36         1       no
dst-promises-q-generator-traceur.js                  35        40         5       no
thunks-generator-co.js                               33        39         6       no
promises-when.js                                     48        57         9       no
promises-compose-q.js                                58        68        10       no
dst-callbacks-generator-genny-traceur.js             34        15        19       no
rx.js                                               158       138        20       no
dst-thunks-generator-co-traceur.js                   33       253       220       no
dst-callbacks-generator-suspend-traceur.js           34         -         -       no
callbacks-async-waterfall.js                         57        57         0      yes
callbacks-deferred-queue.js                          61        61         0      yes
callbacks-flattened-class-ctx.js                     86        86         0      yes
callbacks-flattened-class.js                         90        90         0      yes
callbacks-flattened-passing.js                       71        71         0      yes
callbacks-flattened.js                               63        63         0      yes
callbacks-original.js                                47        47         0      yes
dst-streamline-fibers.js                             33         1        32      yes
fibrous.js                                           34         1        33      yes
thunks-generator-gens.js                             39         -         -      yes
```
