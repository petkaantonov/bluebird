
var args = require('optimist').argv;

var path = require('path');

global.LIKELIHOOD_OF_REJECTION = args.e || 0.1;
global.triggerIntentionalError = function(){
    if(LIKELIHOOD_OF_REJECTION && Math.random() <= LIKELIHOOD_OF_REJECTION) throw new Error("intentional failure");
}

function printPlatform() {
    console.log("\nPlatform info:");
    var os = require("os");
    var v8 = process.versions.v8;
    var node = process.versions.node;
    var plat = os.type() + " " + os.release() + " " + os.arch() + "\nNode.JS " + node + "\nV8 " + v8;
    var cpus = os.cpus().map(function(cpu){
        return cpu.model;
    }).reduce(function(o, model){
        if( !o[model] ) o[model] = 0;
        o[model]++;
        return o;
    }, {});
    cpus = Object.keys(cpus).map(function( key ){
        return key + " \u00d7 " + cpus[key];
    }).join("\n");
    console.log(plat + "\n" + cpus + "\n");
}

var perf = module.exports = function(args, done) {

    var errs = 0;
    var lastErr;
    var times = args.n;

    global.asyncTime = args.t;
    global.parallelQueries = args.p || 10;

    if (args.longStackSupport) {
        global.longStackSupport = require('q').longStackSupport
            = args.longStackSupport;
        require('bluebird').longStackTraces();
    }

    var fn = require(args.file);

    var start = Date.now();


    var warmedUp = 0;
    var tot =  Math.min( 350, times );
    for (var k = 0, kn = tot; k < kn; ++k)
        fn(k,'b','c', warmup);

    var memMax; var memStart; var start;
    function warmup() {
        warmedUp++
        if( warmedUp === tot ) {
            start = Date.now();

            memStart = process.memoryUsage().rss;
            for (var k = 0, kn = args.n; k < kn; ++k)
                fn(k, 'b', 'c', cb);
            memMax = process.memoryUsage().rss;
        }
    }

    function cb (err) {
        if (err && err.message !== "intentional failure") {
            ++errs;
            lastErr = err;
        }
        memMax = Math.max(memMax, process.memoryUsage().rss);
        if (!--times) {
            fn.end && fn.end();
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
    var table = require('text-table');

    var files = args._.filter(function(f) {
        return !/^src-/.test(path.basename(f));
    });

    measure(files, args.n, args.t, args.p, function(err, res) {
        console.log("");
        console.log("results for", args.n, "parallel executions,",
                    args.t, "ms per I/O op");
        if(args.e) console.log("Likelihood of rejection:", args.e);

        res.sort(function(r1, r2) {
            return parseFloat(r1.data.time) - parseFloat(r2.data.time)
        });
        console.log("");
        res = res.map(function(r) {
            var failText = 'OOM';
            if (r.data.timeout) failText = 'T/O';
            return [path.basename(r.file),
                r.data.mem != null ? r.data.time: failText,
                r.data.mem != null ? r.data.mem.toFixed(2) : failText]
        });

        res = [['file', 'time(ms)', 'memory(MB)']].concat(res)

        console.log(table(res, {align: ['l', 'r', 'r']}));
        printPlatform();

    });
}


function measure(files, requests, time, parg, callback) {
    async.mapSeries(files, function(f, done) {
        console.log("benchmarking", f);
        var logFile = path.basename(f) + ".log";
        var profileFlags = ["--prof", "--logfile=C:/etc/v8/" + logFile];

        var argsFork = [__filename,
            '--n', requests,
            '--t', time,
            '--p', parg,
            '--file', f];
        if (args.profile) argsFork = profileFlags.concat(argsFork);
        if (args.harmony) argsFork.unshift('--harmony');
        if (args.longStackSupport) argsFork.push('--longStackSupport');
        var p = cp.spawn(process.execPath, argsFork);

        var complete = false, timedout = false;
        if (args.timeout) setTimeout(function() {
            if (complete) return;
            timedout = true;
            p.kill();
        }, args.timeout);

        var r = { file: f, data: [] };
        p.stdout.on('data', function(d) { r.data.push(d.toString()); });
        p.stdout.pipe(process.stdout);
        p.stderr.pipe(process.stderr);
        p.stdout.on('end', function(code) {
            complete = true;
            try {
                r.data = JSON.parse(r.data.join(''));
            } catch(e) {
                r.data = {time: Number.POSITIVE_INFINITY, mem: null,
                    missing: true, timeout: timedout};
            }
            done(null, r);
        });
    }, callback);
}
