"use strict";
module.exports = function( Promise ) {
    Promise.prototype.call = function Promise$call( propertyName ) {
        var len = arguments.length;

        var args = new Array(len-1);
        for( var i = 1; i < len; ++i ) {
            args[ i - 1 ] = arguments[ i ];
        }

        return this._then( function( obj ) {
                return obj[ propertyName ].apply( obj, args );
            },
            void 0,
            void 0,
            void 0,
            void 0,
            this.call
        );
    };

    function Promise$getter( obj ) {
        var prop = typeof this === "string"
            ? this
            : ("" + this);
        return obj[ prop ];
    }
    Promise.prototype.get = function Promise$get( propertyName ) {
        return this._then(
            Promise$getter,
            void 0,
            void 0,
            propertyName,
            void 0,
            this.get
        );
    };
};
