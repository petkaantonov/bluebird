var fs = require("fs");
var files = fs.readdirSync( "./cujotests").filter(function(file){
    return /\.js$/.test(file);
});
    var fs = require("fs");
    var sys = require('sys');
var spawn = require('child_process').spawn;

(function runner( files, i){

    if( i >= files.length ) process.exit(1);
    else {
        var args =  ["./cujotests/" + files[i]];
        var name = "node";

        var stdio = ['ignore', process.stdout, process.stderr];

        var node = spawn( name, args, {stdio: stdio});

        function exit( code ) {
            if( code !== 0 ) {
                throw new Error("process didn't exit normally");
            }
            else {

                runner( files, i + 1 );
            }
        }

        node.on('exit', exit );
    }
})(files, 0);





