
var args = require('optimist').argv;

var util = require('util');

var path = require('path');

var perf = module.exports = function(args, done) {

    var errs = 0;
    var lastErr;
    var times = args.n;

    global.asyncTime = args.t;

    if (args.longStackSupport) {
        global.longStackSupport = require('q').longStackSupport
            = args.longStackSupport;
    }


    var fn = require(args.file);

    var start = Date.now();

    var memStart = process.memoryUsage().rss;
    for (var k = 0, kn = args.n; k < kn; ++k)
        fn('a','b','c', cb);

    var memMax = process.memoryUsage().rss;

    function cb (err) {
        if (err) {
            ++errs;
            lastErr = err;
        }
        memMax = Math.max(memMax, process.memoryUsage().rss);
        if (!--times) {
            done(null, {
                time: Date.now() - start,
                mem: (memMax - memStart)/1024/1024,
                errors: errs,
                lastErr: lastErr ? lastErr.stack : null
            });
        }
    }
}


function report(err, res) {
    console.log(JSON.stringify(res));
}

if (args.file) {
    perf(args, function(err, res) {
        report(err, res);
        if (res.lastErr)
            console.error(res.lastErr);
    });
} else {
    var cp    = require('child_process')
    var async = require('async');
    var fs    = require('fs');
    var dir = __dirname + '/examples';

    var table = require('text-table');



    var files = args._.filter(function(f) {
        return !/^src-/.test(path.basename(f));
    });

    if( files.length === 1 && files[0].indexOf("*") >= 0 ) {
        var p = path.join( process.cwd(), path.dirname(files[0]) );
        files = fs.readdirSync(p).map(function(file){
            return p + "/" + file;

        });
    }

    if (args.n)
        measure(files, args.n, args.t, function(err, res) {
            console.log("");
            console.log("results for", args.n, "parallel executions,",
                        args.t, "ms per I/O op");

            res.sort(function(r1, r2) {
                return parseFloat(r1.data.time) - parseFloat(r2.data.time)
            });
            console.log("");
            res = res.map(function(r) {
                return [path.basename(r.file),
                    r.data.mem != null ? r.data.time: 'N/A',
                    r.data.mem != null ? r.data.mem.toFixed(2) : 'N/A']
            });

            res = [['file', 'time(ms)', 'memory(MB)']].concat(res)
            console.log(table(res, {align: ['l', 'r', 'r']}));

        });
    else
        async.mapSeries([100,500,1000,1500,2000], function(n, done) {
            console.log("--- n =", n, "---");
            measure(files, n, args.t != null ? args.t : n * args.dt, function(err, res) {
                return done(null, {n: n, res: res});
            });
        }, function(err, all) {
            //structure:
            //[{n: n, res: [{ file: file, data: {time: time, mem: mem}}]}]
            var times = [], mems = [];
            for (var k = 0; k < all[0].res.length; ++k) {
                var file = all[0].res[k].file;
                // skip missing
                if (all[0].res[k].data.missing)
                    continue;
                var memf  = {label: path.basename(file), data: []};
                var timef = {label: path.basename(file), data: []};
                for (var n = 0; n < all.length; ++n) {
                    var requests = all[n].n,
                        time = all[n].res[k].data.time,
                        mem = all[n].res[k].data.mem;
                    timef.data.push([requests, time]);
                    memf.data.push( [requests, mem]);
                }
                times.push(timef);
                mems.push(memf);
            }
            console.log("--------- time ---------");
            console.log(util.inspect(times, false, 10))
            console.log("--------- mem ----------");
            console.log(util.inspect(mems,  false, 10))
        })
}

function measure(files, requests, time, callback) {
    async.mapSeries(files, function(f, done) {
        console.log("benchmarking", f);
        var argsFork = ['--harmony', __filename,
            '--n', requests,
            '--t', time,
            '--file', f];


        var p = cp.spawn("node", argsFork, {
            cwd: process.cwd(),
            env: {
                NODE_PATH: process.cwd()
            }
        });
        var r = { file: f, data: [] };
        p.stderr.pipe( process.stderr );
        p.stdout.on('data', function(d) { r.data.push(d.toString()); });
        p.stdout.pipe(process.stdout);
        p.stdout.on('end', function(code) {
            try {
                r.data = JSON.parse(r.data.join(''));
            } catch(e) {
                r.data = {time: Number.POSITIVE_INFINITY, mem: null,
                    missing: true};
            }
            done(null, r);
        });
    }, callback);
}
