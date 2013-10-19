var fs = require("fs");
var files = fs.readdirSync( "./cujotests").filter(function(file){
    return /\.js$/.test(file);
});
    var fs = require("fs");
    var sys = require('sys');
var spawn = require('child_process').spawn;


var output = [];

(function runner( files, i){

    if( i >= files.length ) {
        var table = require('text-table')
        var res = output.map(function(v){
            return JSON.parse(v.trim())[0];
        }).sort(function(a, b){
            return a.name.localeCompare(b.name);
        }).map(function( obj ){
            return [obj.name, obj.parallelism, obj.iterations, obj.ms, (obj.mem/1024/1024).toFixed(2)];
        });

        var res = [['name', 'parallelism', 'iterations', 'time(ms)', 'memory(MB)']].concat(res);
        console.log(
            table(res, {
                align: ['l', 'r', 'r', 'r', 'r']
            })
        );

        process.exit(1);
    }
    else {
        var args =  ["./cujotests/" + files[i]];
        var name = "node";


        var node = spawn( name, args);

        node.stdout.on('data', function(d) {
            output.push( d + "" );
        });
        node.stdout.pipe(process.stdout);
        node.stderr.pipe(process.stderr);

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





