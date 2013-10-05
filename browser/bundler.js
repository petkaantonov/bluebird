var fs = require("fs");
function js(v){
    return /\.js/i.test(v) && !(/generator/i.test(v));
}

function toReq( v ) {
    return "require('" + v + "')";
}

function toReqFn( v ) {
    return "function(){ return require('" + v + "');}";
}

function buster(v) {
    return "../test/" + v;
}

function mocha(v){
    return "../test/mocha/" + v
}

function write(str){
    fs.writeFileSync( "./main.js", str, {encoding: 'utf8'});
}


var mochaTests =  fs.readdirSync("../test/mocha").filter(js).map(mocha);

var code = "(" + (function(){
    var global = new Function("return this")();
    global.adapter = Promise;
    global.sinon = require("sinon");
    global.assert = require("assert");
}).toString() + ")();\n";


var all = "\n;window.tests = ["+mochaTests.map(toReqFn).join(",\n") + "];";

var promise = 'var Promise = require("../js/bluebird_debug.js");\n';
write(promise + code + all);