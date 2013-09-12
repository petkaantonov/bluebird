var Mocha = require("mocha");
var mochaOpts = {
    reporter: "spec",
    timeout: 200,
    slow: Infinity
};

var mocha = new Mocha(mochaOpts);
mocha.addFile(process.argv[2]);
mocha.run(process.exit);