module.exports = function run( done ) {
    var fs = require("fs");
    var files = fs.readdirSync( "./benchmark/cujotests").filter(function(file){
        return /\.js$/.test(file);
    });

    var sys = require('sys');
    var exec = require('child_process').exec;


    (function runner( files, i){
        if( i >= files.length ) done();
        else {
            var command = "node ./benchmark/cujotests/" + files[i];
            var child = exec(command, function( error, stdout, stderr ){
                if( stdout )process.stdout.write(stdout);
                if( error ) throw error
                else runner( files, i + 1 );
            });
        }
    })(files, 0);
};