Error.stackTraceLimit = Infinity;

var args = require('optimist').argv;

global.longStackSupport = require('q').longStackSupport = true;

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
            //throw err; 
            console.log(err);
            // for browser-compatibility, stratifiedjs reports errors
            // on __oni_stack (or toString()), rather than 'stack'.
            console.error(err.__oni_stack ? err.__oni_stack.map(function(x) { return x.join(':') }).join('\n') : new Error(err.stack).stack);
        }
    });
} else {
    var cp    = require('child_process')
    var async = require('async');
    var fs    = require('fs');    
    var dir = __dirname + '/examples';

    var table = require('text-table');


    var allfiles = fs.readdirSync(dir);

    var files = allfiles.filter(function(f) {
        return !/^src-/.test(f);
    });

    var sources = allfiles.filter(function(f) {
        return !/^dst-/.test(f);
    });

    var sourceOf = function(f) {
        var parts = f.split('-');
        var name = parts[1];
        return sources.filter(function(s) {
            return s.indexOf(name) >= 0;
        })[0] || f;      
    }

    async.mapSeries(files, function(f, done) {
        console.error("testing", f);

        var argsFork = [__filename, 
            '--file', dir + '/' + f];
        if (args.error) argsFork.push('--error')
        if (args.throw) argsFork.push('--throw');
        if (args.athrow) argsFork.push('--athrow');

        if (args.harmony) argsFork.unshift('--harmony');

        var p = cp.spawn(process.execPath, argsFork);


        var lineNumber = fs.readFileSync(dir + '/' + sourceOf(f), 'utf8')
            .split('\n')
            .map(function(l, k) { 
                return { 
                    contained: l.indexOf('FileVersion.insert') >= 0, 
                    line: k + 2
                };
            }).filter(function(l) { return l.contained; })[0].line;

        var r = { file: f, data: [], line: lineNumber };

        p.stderr.pipe(process.stderr);
        p.stderr.on('data', function(d) { r.data.push(d.toString()); });
        p.stderr.on('end', function(code) {
            r.data = r.data.join('').split('\n').filter(function(line) {
                // match lines reporting either compiled or source files: 
                return line.match('examples/' + f) || line.match('examples/' + sourceOf(f))
            }).map(function(l) { 
                return {content: l, 
                    line: l.split(':')[1],
                    distance: Math.abs(l.split(':')[1] - r.line)};
            }).sort(function(l1, l2) {
                return l1.distance - l2.distance;
            })[0];
            done(null, r);
        });
    }, function(err, res) {
        console.log("");
        console.log("error reporting");
        console.log("");
        res = res.sort(function(r1, r2) {
            return parseFloat(r1.data ? r1.data.distance : Infinity)
                - parseFloat(r2.data ? r2.data.distance : Infinity)
        });
        res = res.map(function(r) { 
            return [r.file, r.line, 
                r.data ? r.data.line : '-',
                r.data ? r.data.distance : '-'];
                //r.data ? 'yes ' + r.data.content :'no'];
        })
        res = [['file', 'actual-line', 'rep-line', 'distance']].concat(res)
        console.log(table(res, {align: ['l','r','r','r']}));
    });
}
