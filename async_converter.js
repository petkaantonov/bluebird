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

module.exports = function( src, objName, fnProp ) {
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
};