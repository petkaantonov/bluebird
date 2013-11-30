/**
 * Copyright (c) 2013 Petka Antonov
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:</p>
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
"use strict";
var id = 0;
module.exports = function(Promise) {
    var ASSERT = require("./assert.js");
    var async = require("./async.js");
    if (typeof window === "undefined" || window === null ||
        (!window.addEventListener && !document.attachEvent)
    ) {
        return;
    }
    var instrument = false;

    var now = typeof Date.now === "function"
        ? Date.now
        : function() {
            return new Date().valueOf();
        };

    var guidPrefix = (now() + "bb" + (Math.random())).replace(".", "");
    var guidFromId = function(id) {
        return guidPrefix + String(id);
    };

    var makeEvent = (function() {
        var typeAndTime = false;
        var detail = true;
        var customEventWorks = true;

        try {
            /*jshint nonew:false */
            new CustomEvent("test");
        }
        catch (e) {
            customEventWorks = false;
        }
        var attachProps = function(event, type, promise, child) {
            event.guid = promise._id;
            event.childGuid = child === void 0 ? void 0 : child._id;
            if (detail) {
                event.detail = type === "promise:fulfilled" ||
                    type === "promise:rejected"
                    ? promise._resolvedValue
                    : void 0;
            }
            event.label = "";            if (typeAndTime) {
                event.type = type;
                event.timeStamp = now();
            }
        };
        if (customEventWorks && typeof CustomEvent === "function") {
            detail = false;
            return function(type, promise, child) {
                var ret = new CustomEvent(type, {
                    detail: type === "promise:fulfilled" ||
                        type === "promise:rejected"
                        ? promise._resolvedValue
                        : void 0
                });
                attachProps(ret, type, promise, child);
                return ret;
            };
        }
        else if (typeof document.createEvent === "function" ||
                typeof document.createEvent === "object"
        ) {
            return function(type, promise, child) {
                var ret = document.createEvent("Event");
                ret.initEvent(type, false, false);
                attachProps(ret, type, promise, child);
                return ret;
            };
        }
        else if (document.createEventObject) {
            typeAndTime = true;
            return function(type, promise, child) {
                var ret = document.createEventObject();
                attachProps(ret, type, promise, child);
                return ret;
            };
        }
        else {
            throw new Error("no suitable event listener api found");
        }
    })();

    var triggerEvent = (function() {
        return window.dispatchEvent
                ?
                    function(event) {
                        window.dispatchEvent(event);
                    }
                :
                    function(event) {
                        document.fireEvent(event.type, event);
                    };
    })();


    var addEvent = (function(){
        return window.addEventListener
                ?
                    function(type, fn) {
                        window.addEventListener(type, fn, false);
                    }
                :
                    function(type, fn) {
                        document.attachEvent(type, fn);
                    };
    })();

    Promise.prototype._instrument = function Promise$_instrument(type, child) {
        if (!instrument) {
            return;
        }

        if (type === "promise:created") {
            this._id = guidFromId(id++);
        }
        var event = makeEvent(type, this, child);
        async.invokeLater(triggerEvent, void 0, event);
    };

    addEvent("promise:begin", function(){
        if (instrument) {
            return;
        }
        if (!Promise.hasLongStackTraces()) {
            Promise.longStackTraces();
        }
        instrument = true;
    });

    addEvent("promise:end", function(){
        if (!instrument) {
            return;
        }
        instrument = false;
    });

};
