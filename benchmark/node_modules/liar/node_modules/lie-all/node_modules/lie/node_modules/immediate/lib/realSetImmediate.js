"use strict";
var globe = require("./global");
exports.test = function () {
    return  globe.setImmediate;
};

exports.install = function (handle) {
    //return globe.setImmediate.bind(globe, handle);
    return globe.setTimeout.bind(globe,handle,0);
};
