Date: 2013-10-04


```
results for 10000 parallel executions, 1 ms per I/O op

file                                 time(ms)  memory(MB)
flattened-class-ctx.js                    184       16.38
flattened-class.js                        292       29.62
flattened-noclosure.js                    300       34.22
original.js                               321       34.52
flattened.js                              337       35.09
catcher.js                                365       30.36
promises-bluebird-generator.js            388       42.34
suspend.js                                418       44.96
dst-streamline.js                         441       46.91
promises-bluebird.js                      546       57.57
gens.js                                   547       40.26
co.js                                     723       47.96
promises-compose-bluebird.js              730       72.91
genny.js                                  818       67.91
async.js                                  867       70.62
dst-co-traceur.js                        1016       54.43
dst-suspend-traceur.js                   1145       53.82
dst-genny-traceur.js                     1245       73.39
promises-bluebird-spawn.js               1254       67.30
promises-kew.js                          1633      104.32
dst-stratifiedjs.js                      2061      176.28
rx.js                                    2454      266.47
promises-when.js                         8395      271.50
dst-promises-q-generator-traceur.js     16100      755.54
promises-q-generator.js                 26621      893.09
promises-q.js                           28373      714.09
promises-compose-q.js                   61930      767.79
```