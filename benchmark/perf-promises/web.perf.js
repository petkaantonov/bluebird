/**
 * @fileOverview Open webserver for promises perf test.
 *
 * -- Not conclusive, too much noise --
 *
 */

var express = require('express');
var mongoose = require('mongoose');
var __ = require('lodash');
var when = require('when');
var async = require('async');

var web = module.exports = {};

var conCount = 0;

var app = express();

/**
 * Promises route, will perform 3 writes and 3 reads and a delete to mongo.
 *
 */
web.promises = function(req, res) {

  var value = +new Date();
  web.saveProm(value)
    .then(__.partial(web.readProm, value), console.error)
    .then(__.partial(web.saveProm, value), console.error)
    .then(__.partial(web.readProm, value), console.error)
    .then(__.partial(web.saveProm, value), console.error)
    .then(__.partial(web.readProm, value), console.error)
    .then(__.partial(web.deleteProm, value), console.error)
    .then(function(){
      res.send(web.response);
    }, console.error);
};

/**
 * Async route, will perform 3 writes and 3 reads to mongo.
 *
 */
web.async = function(req, res) {

  var value = +new Date();

  async.series([
    __.partial(web.saveCb, value),
    __.partial(web.readCb, value),
    __.partial(web.saveCb, value),
    __.partial(web.readCb, value),
    __.partial(web.saveCb, value),
    __.partial(web.readCb, value),
    __.partial(web.deleteCb, value),
  ], function() {
    res.send(web.response);
  });

};

// write to db using a promise
web.saveProm = function(value) {
  var def = when.defer();
  var doc = new web.Model({onelove: value});
  doc.save(def.resolve);
  return def.promise;
};

// read from db using a promise
web.readProm = function(value) {
  var def = when.defer();
  web.Model.findOne({onelove: value}, 'onelove', def.resolve);
  return def.promise;
};

// delete record
web.deleteProm = function(value) {
  var def = when.defer();
  web.Model.remove({onelove: value}, def.resolve);
  return def.promise;
};


// write to db using a callback
web.saveCb = function(value, cb) {
  var doc = new web.Model({onelove: value});
  doc.save(cb);
};

// read from db using a callback
web.readCb = function(value, cb) {
  web.Model.findOne({onelove: value}, 'onelove', cb);
};

// delete from db using a callback
web.deleteCb = function(value, cb) {
  web.Model.remove({onelove: value}, cb);
};

//
// Webserver
//
web.response = '<!DOCTYPE html><html><head><title>Webserver test</title></head>' +
  '<body>This is a webserver test page.</body></html>';

app.set('views', './views');
app.set('view engine', 'jade');
app.locals.self = true;

app.get('/', web.promises);
app.get('/prom', web.promises);
app.get('/async', web.async);

app.listen(6000);


// mongo connection
mongoose.connect('mongodb://localhost/perfTest');
var schema = mongoose.Schema({
  onelove: {type: String}
});
web.Model = mongoose.model('nolove', schema);

