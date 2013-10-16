module.exports = Test;

// TODO: Abstract test reporting and create CSV reporter



function Test(testName, iterations, description) {
    this.name = testName;
    this.iterations = iterations;
    this.description = description;
    this.results = [];
    this.errors = [];
    this.byLib = {};
}

Test.prototype = {
    addResult: function(libName, elapsed, computed) {
        var result = new Result(libName, this.iterations, elapsed, computed);

        this.byLib[libName] = result;
        this.results.push(result);
    },

    addError: function(libName, error) {
        this.errors.push({ name: libName, error: error });
    },

    getSortedResults: function() {
        return this.results.slice().sort(sortByTotal);
    },

    run: function(testCases, exitWhenDone) {
        console.log("\n###Running### "+this.name+"\n");
        if(testCases.length === 0) {
            console.error("0 test cases");
            return;
        }

        var promise = testCases.slice(1).reduce(function(p, task) {
            return p.then(task);
        }, testCases[0]()).then(this.report.bind(this));

        // some libs (e.g. deferred) seem to cause the process to hang
        // when they have leftover unresolved promises, so we have to
        // force the process to exit
        promise.then(exitS, exitF);
        var self = this;
        function exitF( reason ) {
            console.error( "Exiting " + self.name + " from failure.");
            console.error( reason.stack );
            process.exit(-1);
        }

        function exitS() {
            console.log( "Exiting " + self.name + " successfully.");
            process.exit(0);
        }
    },

    report: function() {
        console.log('');
        console.log('==========================================================');
        console.log('Test:', this.name, 'x', this.iterations);

        if(this.description) {
            console.log(this.description);
        }

        console.log('----------------------------------------------------------');
        console.log(columns([
            'Name',
            'Time ms',
            'Avg ms',
            'Diff %'
        ], 8));
        var results = this.getSortedResults();

        results.forEach(function(r) {
            var diff = difference(results[0].total, r.total);
            console.log(columns([
                r.name,
                formatNumber(r.total, 0),
                formatNumber(r.avg, 4),
                formatNumber(diff, 2)
            ], 8));
        });

        if(this.errors.length) {
            this.errors.forEach(function(e) {
                console.log(e.name, e.error);
            });
        }

    }
};

function sortByTotal(r1, r2) {
    return r1.total - r2.total;
}

function formatNumber(x, n) {
    return x === 0 ? '-' : Number(x).toFixed(n);
}

function Result(name, iterations, time, value) {
    this.name = name;
    this.total = time;
    this.avg = time/iterations;
    this.value = value;
}

function difference(r1, r2) {
    return ((r2-r1) / r1) * 100;
}

function columns(cols, size) {
    var align = leftAlign;
    return cols.map(function(val) {
        var s = align(String(val), size);

        align = rightAlign;

        return s;
    }).join('');
}

function leftAlign(s, size) {
    while(s.length < size) {
        s = s + ' ';
    }

    return s;
}

function rightAlign(s, size) {
    while(s.length < size) {
        s = ' ' + s;
    }

    return ' ' + s;
}
