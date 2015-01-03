var assert = require("assert");
assert.equal(require.main, module);
var fs = require("fs");
var con = fs.readFileSync("./API.md", "utf8");

var con = con.split("\n");
var currentTopic = "";

con.map(function(v) {
    if (v.indexOf("######") >= 0) {
        var line = v;
        var optionName = v.match(/######Option: `([^`]+)`/)[1];
        line = line.replace(/[\- ]/g, "\x00").replace(/[^a-zA-Z0-9\x00]/g, "").toLowerCase().replace(/\x00/g, "-");
        console.log("        - [Option: `"+optionName+"`](#"+line+")");
    } else if( v.indexOf("#####") >= 0 ) {
        var line = v;
        var methodName = line.match(/#####`([^)]+\))/);

        if( !methodName ) {
            methodName = line.match(/#####`([^`]+)/)[1];
        }
        else {
            methodName = methodName[1];
        }

        line = line.replace(/[\- ]/g, "\x00").replace(/[^a-zA-Z0-9\x00]/g, "").toLowerCase().replace(/\x00/g, "-");


        console.log( "    - [`"+methodName+"`](#"+line+")" );
    } else if (v.indexOf("##") === 0) {
        var line = v.substr(2);
        var topic = line;
        line = line.replace(/[\- ]/g, "\x00").replace(/[^a-zA-Z0-9\x00]/g, "").toLowerCase().replace(/\x00/g, "-");
        console.log("- ["+topic+"](#" + line+")");
    }
});
