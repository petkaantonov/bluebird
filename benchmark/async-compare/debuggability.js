Error.stackTraceLimit = Infinity;

var args = require('optimist').argv;

global.longStackSupport = require('q').longStackSupport = true;
require("bluebird").longStackTraces();

var path = require('path');

var perf = module.exports = function(args, done) {
    global.asyncTime = args.t || 1;
    global.testThrow = args.throw;
    global.testThrowAsync = args.athrow;
    global.testError = args.error;

    var fn = require(args.file);
    fn('a','b','c', done);
}


if (args.file) {
    perf(args, function(err) {
        if (err) {
            // for browser-compatibility, stratifiedjs reports errors
            // on __oni_stack (or toString()), rather than 'stack'.

            var stratifiedStack = err.__oni_stack &&
                err.__oni_stack.map(function(x) {
                return x.join(':') }).join('\n');

            var callbackStack = new Error().stack
                .split('\n').slice(1).join('\n');
            console.error(
                stratifiedStack ||
                err.stack + '\nCallback stack:\n' + callbackStack);
        }
    });
} else {
    var cp    = require('child_process')
    var async = require('async');
    var fs    = require('fs');
    var dir   = path.join(__dirname, 'examples');

    var table = require('text-table');


    var allfiles = fs.readdirSync(dir);

    var files = allfiles.filter(function(f) {
        return !/^src-/.test(f);
    });

    var sources = allfiles.filter(function(f) {
        return !/^dst-/.test(f);
    });

    var sourceOf = function(f) {
        if (!/^dst-/.test(f)) return f;        
        var name = f.replace(/^dst-/, '').replace(/-[^-]+.js$/, '');
        return sources.filter(function(s) {
            return s.indexOf(name) >= 0;
        })[0] || f;
    }

    async.mapSeries(files, function(f, done) {
        console.error("testing", f);

        var argsFork = [__filename,
            '--file', path.join(dir, f)];
        if (args.error) argsFork.push('--error')
        if (args.throw) argsFork.push('--throw');
        if (args.athrow) argsFork.push('--athrow');

        if (args.harmony) argsFork.unshift('--harmony');

        var p = cp.spawn(process.execPath, argsFork);


        var lineNumber = -1;

        (function(){
            var lines = fs.readFileSync(path.join(dir, sourceOf(f)), 'utf8').split('\n');
            var sawFileVersionInsert = false;
            for (var i = 0, len = lines.length; i < len; ++i) {
                var item = lines[i];
                if (!sawFileVersionInsert) {
                    if (item.indexOf('FileVersion.insert') >= 0) {
                        sawFileVersionInsert = true;
                    }
                }
                else {
                    if (item.indexOf('execWithin') >= 0) {
                        lineNumber = i + 1;
                        break;
                    }
                }
            }
            if (lineNumber < 0) {
                throw new Error("Example didn't contain throwing line: "
                                + sourceOf(f));
            }
        })();
        var r = { file: f, data: [], line: lineNumber };
        var separator = require("path").sep;
        p.stderr.pipe(process.stderr);
        p.stderr.on('data', function(d) {  r.data.push(d.toString());});
        p.on('exit', function(code, second) {
            console.log("exit code", code, second);
        //p.stderr.on('end', function(code) {
            r.data = r.data.join('').split('\n').filter(function(line) {
                // match lines reporting either compiled or source files:
                return line.indexOf('examples\\' + f) >= 0 ||
                    line.indexOf('examples\\' + sourceOf(f)) >= 0 ||
                    line.indexOf('examples/' + f) >= 0 ||
                    line.indexOf('examples/' + sourceOf(f)) >= 0

            }).map(function(l) {
                //Windows dirs has colons in drives like "C:\"
                //so splitting on colon doesn't work :P
                var rlineno = /(?:\.js|\.sjs|\._js):(\d+)/;

                var line = rlineno.exec(l)[1];
                return {
                    content: l,
                    line: line,
                    distance: Math.abs(line - r.line)
                };
            }).sort(function(l1, l2) {
                return l1.distance - l2.distance;
            });


            r.data = r.data[0];
            r.crashed = !!code;
            done(null, r);
        });
    }, function(err, res) {

        console.log("");
        console.log("error reporting");
        console.log("");
        res = res.sort(function(r1, r2) {
            var ret = r1.crashed - r2.crashed;
            if (ret === 0)
            ret = parseFloat(r1.data ? r1.data.distance : Infinity)
                - parseFloat(r2.data ? r2.data.distance : Infinity);

            if( ret === 0 ) {
                ret = r1.file < r2.file ? -1 :
                       r1.file > r2.file ? 1 :
                       0;
            }
            return ret;
        });
        res = res.map(function(r) {
            return [r.file, r.line,
                r.data ? r.data.line : '-',
                r.data ? r.data.distance : '-',
                r.crashed ? 'yes' : 'no'];
        })
        res = [['file', 'actual-line', 'rep-line', 'distance', 'crashed']].concat(res)
        console.log(table(res, {align: ['l','r','r','r', 'r']}));
    });
}
