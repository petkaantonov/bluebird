Date: 2013-10-04


```
results for 10000 parallel executions, 1 ms per I/O op

file                                        time(ms)  memory(MB)
callbacks-flattened-class-ctx.js                 181       16.34
callbacks-flattened-passing.js                   283       34.22
callbacks-flattened-class.js                     292       28.84
callbacks-original.js                            328       34.96
callbacks-flattened.js                           331       35.09
callbacks-catcher.js                             359       30.34
promises-bluebird-generator.js                   376       41.86
dst-streamline.js                                454       46.91
callbacks-generator-suspend.js                   472       45.25
promises-bluebird.js                             518       57.12
thunks-generator-gens.js                         548       40.28
promises-compose-bluebird.js                     732       72.94
thunks-generator-co.js                           743       47.93
callbacks-generator-genny.js                     813       67.72
callbacks-async-waterfall.js                     990       90.07
dst-callbacks-generator-suspend-traceur.js      1074       50.67
dst-thunks-generator-co-traceur.js              1081       53.39
promises-bluebird-spawn.js                      1242       67.87
dst-callbacks-generator-genny-traceur.js        1256       75.09
promises-kew.js                                 1620      105.40
rx.js                                           2405      266.50
dst-stratifiedjs.js                             2414      148.86
promises-when.js                               10631      271.96
dst-promises-q-generator-traceur.js            15986      753.72
promises-q-generator.js                        20666      676.07
promises-q.js                                  28694      715.23
promises-compose-q.js                          59789      765.49
```
