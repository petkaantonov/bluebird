var Promise = require("bluebird");
var run = require("./utils.js").run;
var semver = require("semver-utils");


function writePkg(pkg) {
    require("fs").writeFileSync("./package.json", JSON.stringify(pkg, null, "  ") + "\n", "utf8");
}

function updateBower(version) {
    var bower = JSON.parse(require("fs").readFileSync("./bower.json", "utf8"));
    bower.version = version;
    require("fs").writeFileSync("./bower.json", JSON.stringify(bower, null, "  "), "utf8");
}


var type = process.argv[2].toLowerCase();

var types = ["major", "minor", "patch", "build", "release"];

if (types.indexOf(type) === -1) {
    throw new Error("unknown type "+ type);
}


var pkg = JSON.parse(require("fs").readFileSync("./package.json", "utf8"));
var version = pkg.version;
var original = version;
version = semver.parse(version);

if (type === "build") {
    type = "release";
}

var cur = version[type];

if (!cur) {
    throw new Error("invalid type " + type);
}

cur = parseInt(cur, 10);
cur++;

version[type] = String(cur);

if(type === "major") {
    version.minor = version.patch = version.release = "0";
}
if(type === "minor") {
    version.patch = version.release = "0";
}
if(type === "patch") {
    version.release = "0";
}

if (type !== "release") {
    version.release = null;
}

version = semver.stringify(version);

pkg.version = version;
updateBower(version);
writePkg(pkg);

var Path = require("path");
Promise.resolve()
.then(function() {
    return run("git", ["add", "-A"]);
})
.then(function() {
    return run("git", ["commit", "-a", "-m", "Release v" + version]);
})
.then(function() {
    return run("git", ["tag", "-a", "v" + version, "-m", "Version " + version]);
})
.then(function() {
    console.log("Bumped version to v" + version);
})
.catch(function(e) {
    console.log("Unable to bump version to v" + version);
    console.error("")
    console.error("Error from cmd " + e.cmd);
    console.error("")
    console.error(e.stack || (e + ""));
    pkg.version = original;
    writePkg(pkg);
    process.exit(-1);
})
.catch(function() {
    console.error("Failed rolling package.json back to " + original + ".");
    console.error("Please do it manually.");
})

