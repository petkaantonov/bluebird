var assert = require("assert");
assert.equal(require.main, module);
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var path = require("path");
var sys = require('sys');
var execAsync = Promise.promisify(require('child_process').exec);
var command = "git";
var args = ["for-each-ref", "--format", "\"%(refname) %(taggerdate)\"", "refs/tags"];

Date.prototype.isoString = function() {
    return this.toISOString().split("T")[0];
};

function parseTags( tags ) {
    var rtag = /^refs\/tags\/v(\d+\.\d+\.\d+(?:-\d+)?) (.+)$/;
    return tags.split("\n").map(function(line){
        var matches = rtag.exec(line);
        if( !matches ) return null;
        return {
            version: matches[1],
            date: Date.parse(matches[2])
        };
    }).filter(Boolean).sort(function(a, b){
        return b.date - a.date;
    });
}

function parseChangeLog(changelog) {
    var rversion = /^## (\d+\.\d+\.\d+(?:-\d+)?)/;
    return changelog.split("\n").map(function(line){
        var matches = rversion.exec(line);
        if( matches ) {
            return {version: matches[1]}
        }
        return null;
    }).filter(Boolean).reduce(function(o, cur){
        o[cur.version] = true;
        return o;
    }, {});
}

var gitTags = execAsync( command + " " + args.join(" ") ).spread(function(stdout){
    return stdout;
});
var changelog = fs.readFileAsync( "./changelog.md", "utf8" );


Promise.join(gitTags, changelog).spread(function(tags, changelog) {
    var oldText = changelog;
    tags = parseTags(tags);
    changelog = parseChangeLog(changelog);

    tags = tags.filter(function(v){
        return !(changelog[v.version]);
    });

    if( !tags.length ) {
        return oldText;
    }

    var newText = tags.map(function(v) {
        return "## " + v.version + " ("+ (new Date(v.date).isoString()) + ")\n\n" +
            "Features:\n\n - feature\n" +
            "\nBugfixes:\n\n - bugfix\n\n";
    }).join("");

    return fs.writeFileAsync( "./changelog.md", newText + oldText );
});

