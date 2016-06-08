var utils = require("./utils.js");
var path = require("path");

module.exports = function() {
    var wd = path.join(__dirname, "..");
    return utils.run("node_modules/jshint/bin/jshint", [
        "--verbose",
        "--reporter",
        "node_modules/jshint-stylish/stylish.js",
        "src/"
    ], wd);
};
function log(value) {
    process.stdout.write(value.stdout);
    process.stderr.write(value.stderr);
}
if (require.main === module) {
    module.exports().then(log, log);
}

