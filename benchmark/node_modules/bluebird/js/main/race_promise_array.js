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
module.exports = function( Promise, PromiseArray ) {
var util = require("./util.js");
var inherits = util.inherits;
function RacePromiseArray( values, caller, boundTo ) {
    this.constructor$( values, caller, boundTo );
}
inherits( RacePromiseArray, PromiseArray );

RacePromiseArray.prototype._init =
function RacePromiseArray$_init() {
    this._init$(void 0, 3);
};

RacePromiseArray.prototype._promiseFulfilled =
function RacePromiseArray$_promiseFulfilled( value ) {
    if( this._isResolved() ) return;
    this._fulfill( value );

};
RacePromiseArray.prototype._promiseRejected =
function RacePromiseArray$_promiseRejected( reason ) {
    if( this._isResolved() ) return;
    this._reject( reason );
};

return RacePromiseArray;
};
