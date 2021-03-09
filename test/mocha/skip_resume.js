"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");

describe("Promise.skip/resume", function () {

    specify("Should resume from a skip point", function() {
        return Promise.resolve(1).then(function(res){
            assert.equal(1, res);
            Promise.skipTo("point1", 2);
            return 3;//should be ignored
        }).then(assert.fail)//should be skip
          .then(assert.fail)//should be skip
          .then(assert.fail)//should be skip
          .then(assert.fail)//should be skip
        .resume("point1", function(res){
            assert.equal(2, res);
            return Promise.resolve(3);
        }).then(function(res) {
            assert.equal(3, res);
            return null;
        }).catch(assert.fail);
    });

    specify("Should ignore a resume point if there is no skip point", function() {
        return Promise.resolve(1).then(function(res){
            assert.equal(1, res);
            return 2;//should be ignored
        }).then(function(res){
            assert.equal(2, res);
            return 3;//should be ignored
        }).resume("point1",assert.fail)
        .then(function(res) {
            assert.equal(3, res);
            return null;
        }).catch(assert.fail);
    });

    specify("Should execute a resumeOrContinue point even with no skip point", function() {

        //without SKIP
        Promise.resolve(1).then(function(res){
            assert.equal(1, res);
            return 2;//should be ignored
        }).then(function(res){
            assert.equal(2, res);
            return 3;//should be ignored
        }).resumeOrContinue("point1",function(res){
            assert.equal(3, res);
            return 4;//should be ignored
        }).then(function(res) {
            assert.equal(4, res);
            return null;
        }).catch(assert.fail);

        //Skiping!
        Promise.resolve(1).then(function(res){
            assert.equal(1, res);
            Promise.skipTo("point1", 2);
            return 3;//should be ignored
        }).then(function(res){
            assert.fail();
            return 4;//should be ignored
        }).resumeOrContinue("point1",function(res){
            assert.equal(2, res);
            return 4;//should be ignored
        }).then(function(res) {
            assert.equal(4, res);
            return null;
        }).catch(assert.fail);
    });

    specify("Should works with more than one skip point", function() {

        //to skip points thrown in sequence
        Promise.resolve(1).then(function(res){
            assert.equal(1, res);
            Promise.skipTo("point1", 2);
            return 3;//should be ignored
        }).then(assert.fail)//should be skip
        .then(assert.fail)//should be skip
        .then(assert.fail)//should be skip
        .resume("point1", function(res) {
            assert.equal(2, res);
            return Promise.resolve(3);
        }).then(function(res) {
            assert.equal(3, res);
            return 4;
        }).then(function(res) {
            assert.equal(4, res);
            Promise.skipTo("point2", 5);
            return null;
        }).then(assert.fail)//should be skip
        .then(assert.fail)//should be skip
        .then(assert.fail)//should be skip
        .resume("point2", function(res) {
            assert.equal(5, res);
            return null;
        })
        .catch(assert.fail);

        //to skip point overlapping another one

        Promise.resolve(1).then(function(res){
            assert.equal(1, res);
            Promise.skipTo("point1", 2);
            return 3;//should be ignored
        }).then(assert.fail)//should be skip
        .then(assert.fail)//should be skip
        .then(assert.fail)//should be skip
        .resume("point2", assert.fail)
        .then(assert.fail)//should be skip
        .then(assert.fail)//should be skip
        .resume("point1", function(res) {
            assert.equal(2, res);
            return 3;
        }).then(function(res) {
            assert.equal(3, res);
            return null;
        })
        .catch(assert.fail);

    });

    specify("Should execute a resumeOrContinue point even after a catch", function() {

        //without SKIP
        Promise.resolve(1).then(function(res){
            assert.equal(1, res);
            return 2;//should be ignored
        }).then(function(res){
            throw new Error('A terrible error');
            return 3;//should be ignored
        }).then(function(res){
            Promise.skipTo("point1", 4);
            assert.fail();
            return 5;//should be ignored
        }).catch(function(res){
            return 6;//should be ignored
        }).resumeOrContinue("point1",function(res){
            assert.equal(6, res);
            return 7;//should be ignored
        }).then(function(res) {
            assert.equal(7, res);
            return null;
        });
    });

});
