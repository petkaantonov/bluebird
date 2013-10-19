module.exports = Test;

var reportType = "bluebird-dev";

// TODO: Abstract test reporting and create CSV reporter


function Test(testName, iterations, parallelism, description) {
    this.parallelism = parallelism;
    this.name = testName;
    this.iterations = iterations;
    this.description = description;
    this.results = [];
    this.errors = [];
    this.byLib = {};
}

Test.memNow = function() {
    return process.memoryUsage().rss;
};

Test.memDiff = function(prev) {
    return process.memoryUsage().rss - prev;
}

Test.prototype = {
    addResult: function(libName, elapsed, mem) {
        var result = new Result(libName, this.iterations, elapsed, void 0, mem);

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
            process.exit(0);
        }
    },

    report: function() {
        var results = this.getSortedResults().map(function(result){
            return {
                ms: result.total,
                name: result.name + "-" + this.name,
                parallelism: this.parallelism,
                iterations: this.iterations,
                mem: result.mem
            };
        }, this)
        console.log(JSON.stringify(results));

    }
};

function sortByTotal(r1, r2) {
    return r1.total - r2.total;
}

function formatNumber(x, n) {
    return x === 0 ? '-' : Number(x).toFixed(n);
}

function Result(name, iterations, time, value, mem) {
    this.name = name;
    this.total = time;
    this.avg = time/iterations;
    this.value = value;
    this.mem = mem;
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
