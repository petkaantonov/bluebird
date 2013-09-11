
var fs = require('fs');
var table = require('text-table');

var stats = module.exports = function stats() {
    return fs.readdirSync(__dirname + '/examples').filter(function(f){ 
       return !/^dst-/.test(f);
    }).map(function(f) {
        var file = fs.readFileSync('./examples/'+f).toString();
        file = file.replace(/function\s*\*/g, 'function')
            .replace(/yield/g, 'void');
        try {
            var tree = require('esprima').parse(file, {
                tolerant: true,
                tokens: true
            });
        } catch (e) {
            console.log("In file", f, ":");
            console.log(e);
        }
        return {name: f, tokens: tree.tokens.length}
    });
}

var s = stats();

var mintokens = s.reduce(function(acc, f) { 
    return Math.min(acc, f.tokens);
}, Number.POSITIVE_INFINITY);

s = s.sort(function(s1, s2) {
    return s1.tokens - s2.tokens;
});

s.forEach(function(f) {
    f.complexity = f.tokens / mintokens;
});

console.log(table([['name', 'tokens', 'complexity']].concat(
    s.map(function(f) { return [f.name, f.tokens, f.complexity.toFixed(2)] })
), {align: ['l','r','r']}));

