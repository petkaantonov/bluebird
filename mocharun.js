var file = process.argv[2];

if( file === "aplus.js" ) {
    var adapter = require("./js/bluebird_debug.js");
    require("promises-aplus-tests")(adapter, process.exit);
    return;
}

var Mocha = require("mocha");
var mochaOpts = {
    reporter: "spec",
    timeout: 200,
    slow: Infinity
};

var mocha = new Mocha(mochaOpts);
mocha.addFile(process.argv[2]);
mocha.run(process.exit);