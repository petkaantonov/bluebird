//All kinds of conversion passes over the source code
var jsp = require("acorn");
var walk = require("acorn/util/walk.js");
var rnonIdentMember = /[.\-_$a-zA-Z0-9]/g;

function equals( a, b ) {
    if( a.type === b.type ) {
        if( a.type === "MemberExpression" ) {
            return equals( a.object, b.object ) &&
                equals( a.property, b.property );
        }
        else if( a.type === "Identifier" ) {
            return a.name === b.name;
        }
        else if( a.type === "ThisExpression" ) {
            return true;
        }
        else {
            console.log("equals", a, b);
            unhandled();
        }
    }
    return false;
}

function getReceiver( expr ) {
    if( expr.type === "MemberExpression" ) {
        return expr.object;
    }
    return null;
}

function nodeToString( expr ) {
    if( expr.type === "Identifier" ) {
        return expr.name;
    }
    else if( expr.type === "MemberExpression" ) {
        if( expr.computed )
            return nodeToString( expr.object ) + "[" + nodeToString( expr.property ) + "]";
        else
            return nodeToString( expr.object ) + "." + nodeToString( expr.property );
    }
    else if( expr.type === "UnaryExpression" ) {
        return "(" + expr.operator + " " + nodeToString( expr.argument ) + ")";
    }
    else if( expr.type === "Literal" ) {
        return expr.raw;
    }
    else if( expr.type === "BinaryExpression" ) {
        return "("+nodeToString(expr.left) + " " +
            expr.operator + " " +
            nodeToString(expr.right) + ")";
    }
    else if( expr.type === "ThisExpression" ) {
        return "this";
    }
    else if( expr.type === "NewExpression" ) {
        return "new " + nodeToString(expr.callee) + "(" + nodeToString(expr.arguments) +")";
    }
    //assuming it is arguments
    else if( Array.isArray( expr ) ) {
        var tmp = [];
        for( var i = 0, len = expr.length; i < len; ++i ) {
            tmp.push( nodeToString(expr[i]) );
        }
        return tmp.join(", ");
    }
    else {
        console.log( "nodeToString", expr );
        unhandled()
    }
}

function DynamicCall( receiver, fnDereference, arg, start, end ) {
    this.receiver = receiver;
    this.fnDereference = fnDereference;
    this.arg = arg;
    this.start = start;
    this.end = end;
}

DynamicCall.prototype.toString = function() {
    return nodeToString(this.fnDereference) + ".call(" +
        nodeToString(this.receiver) + ", " +
        nodeToString(this.arg) +
    ")";
};

function DirectCall( receiver, fnName, arg, start, end ) {
    this.receiver = receiver;
    this.fnName = fnName;
    this.arg = arg;
    this.start = start;
    this.end = end;
}
DirectCall.prototype.toString = function() {
    return nodeToString(this.receiver) + "." + nodeToString(this.fnName) +
        "(" + nodeToString(this.arg) + ")"
};


function Assertation(left, right, start, end) {
    this.start = start;
    this.end = end;
    this.left = left;
    this.right = right;
}

Assertation.prototype.toString = function() {
    if( this.right === void 0 ) {
        return "assert("+nodeToString(this.left)+")";
    }
    else {
        return "assert("+nodeToString(this.left)+" === "+nodeToString(this.right)+")";
    }
};

function ConstantReplacement( value, start, end ) {
    this.value = value;
    this.start = start;
    this.end = end;
}

ConstantReplacement.prototype.toString = function() {
    return nodeToString(this.value);
};

function Empty(start, end) {
    this.start = start;
    this.end = end;
}
Empty.prototype.toString = function() {
    return "";
};

module.exports = {

    constants: function( src ) {
        var constants = {};
        var results = [];
        var identifiers = [];
        var ast = jsp.parse(src);
        walk.simple(ast, {
            CallExpression: function( node ) {
                var start = node.start;
                var end = node.end;
                var callee = node.callee;
                if( callee.type === "Identifier" &&
                    node.arguments.length === 2 &&
                    node.arguments[0].type === "Identifier" &&
                    callee.name === "CONSTANT" ) {
                    var args = node.arguments;

                    results.push( new Empty( start, end + 1 ) );

                    var name = args[0];
                    var nameStr = name.name;
                    var expr = args[1];
                    constants[nameStr] = {
                        identifier: name,
                        value: expr
                    };
                }
            },

            Identifier: function( node ) {
                identifiers.push( node );
            }
        });

        for( var i = 0, len = identifiers.length; i < len; ++i ) {
            var id = identifiers[i];
            var constant = constants[id.name];
            if( constant === void 0 ) {
                continue;
            }
            if( constant.identifier === id ) {
                continue;
            }

            results.push( new ConstantReplacement( constant.value, id.start, id.end ) );

        }

        return results;
    },

    asserts: function( src, enabled ) {
        var ast = jsp.parse(src);
        var results = [];
        walk.simple(ast, {
            CallExpression: function( node ) {
                var start = node.start;
                var end = node.end;
                var callee = node.callee;
                if( callee.type === "Identifier" &&
                    callee.name === "ASSERT" ) {
                    if( !enabled ) {
                        results.push( new Empty( start, end + 1 ) );
                        return;
                    }
                    var args = node.arguments;

                    if( args.length === 2 ) {
                        results.push( new Assertation( args[0], args[1], start, end ) );
                    }
                    else if( args.length === 1 ) {
                        results.push( new Assertation( args[0], void 0, start, end ) );
                    }
                    else {
                        throw new Error("Invalid ASSERT");
                    }
                }
            }
        });
        return results;
    },

    asyncConvert: function( src, objName, fnProp ) {
        var ast = jsp.parse(src);
        var results = [];
        walk.simple(ast, {
            CallExpression: function( node ) {
                var start = node.start;
                var end = node.end;
                if( node.callee.type === "MemberExpression" &&
                    node.callee.object.name === objName &&
                    node.callee.property.name === fnProp &&
                    node.arguments.length === 3
                ) {

                    var args = node.arguments;
                    var fnDereference = args[0];
                    var dynamicReceiver = args[1];
                    var arg = args[2];

                    var receiver = getReceiver(fnDereference);

                    if( receiver == null || !equals(receiver, dynamicReceiver) ) {
                        //Have to use fnDereference.call(dynamicReceiver, arg);
                        results.push(
                            new DynamicCall( dynamicReceiver, fnDereference, arg, start, end )
                        );
                    }
                    else {
                        var fnName = fnDereference.property;
                        results.push(
                            new DirectCall( receiver, fnName, arg, start, end )
                        );
                        //Can use receiver.fnName( arg );

                    }


                }
            }
        });
        return results;
    },

    convertSrc: function( src, results ) {
        if( results.length ) {
            results.sort(function(a, b){
                var ret = a.start - b.start;
                if( ret === 0 ) {
                    ret = a.end - b.end;
                }
                return ret;
            });
            var ret = "";
            var start = 0;
            for( var i = 0, len = results.length; i < len; ++i ) {
                var item = results[i];
                ret += src.substring( start, item.start );
                ret += item.toString();
                start = item.end;
            }
            ret += src.substring( start );
            return ret;
        }
        return src;
    }
};