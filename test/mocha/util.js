"use strict";
var assert = require("assert");
var util = require("../../js/debug/util");


describe("utilities", function() {

    var hookExtension = function() {
        hookExtension.executedFlag = true;
    };

    var hookExtension1 = function() {
        hookExtension1.executedFlag = true;
    };

    beforeEach(function () {
        if (Promise.prototype.hook) delete Promise.prototype.hook;
        hookExtension.executedFlag = false;
        hookExtension1.executedFlag = false;
    });

    it("hookTo function adds handler to a hook", function() {
        util.hookTo(Promise.prototype,"hook", hookExtension);
        var promise = new Promise(function (){});
        assert (promise.hook.extensions[0].executedFlag === false);
        promise.hook();
        assert (promise.hook.extensions[0].executedFlag === true);
    });

    it("hookTo function adds 2 handlers to a hook", function() {
        util.hookTo(Promise.prototype,"hook", hookExtension);
        util.hookTo(Promise.prototype,"hook", hookExtension1);
        var promise = new Promise(function (){});
        assert (promise.hook.extensions[0].executedFlag === false);
        assert (promise.hook.extensions[1].executedFlag === false);
        promise.hook();
        assert (promise.hook.extensions[0].executedFlag === true);
        assert (promise.hook.extensions[1].executedFlag === true);
    });

    it("unhookFrom function removes handler from a hook", function() {
        util.hookTo(Promise.prototype,"hook", hookExtension);
        util.unhookFrom(Promise.prototype,"hook", hookExtension);
        var promise = new Promise(function (){});
        assert(typeof Promise.prototype["hook"].extensions.length === 0);
        assert(typeof promise.hook.extensions.length === 0);
    });

    after(function () {
        delete Promise.prototype.hook;
    });
});
