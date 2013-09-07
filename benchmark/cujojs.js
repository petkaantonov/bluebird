module.exports = function run( done ) {
    var fs = require("fs");
    var files = fs.readdirSync( "./benchmark/cujotests").filter(function(file){
        return /\.js$/.test(file);
    });
        var fs = require("fs");
        var sys = require('sys');
    var spawn = require('child_process').spawn;

    (function runner( files, i){

        if( i >= files.length ) done();
        else {
            var node = spawn('node', ["./benchmark/cujotests/" + files[i]]);
            node.stdout.on('data', function( data ) {
                process.stdout.write(data);
            });

            node.stderr.on('data', function( data ) {
                process.stderr.write(data);
            });

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
};



