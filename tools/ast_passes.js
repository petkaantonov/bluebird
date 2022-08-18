//All kinds of conversion passes over the source code
var jsp = require("acorn");
var walk = require("acorn-walk");
var rnonIdentMember = /[.\-_$a-zA-Z0-9]/g;
var global = new Function("return this")();

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
    if( expr == null || typeof expr !== "object" ) {
        if( expr === void 0 ) {
            return "void 0";
        }
        else if( typeof expr === "string" ) {
            return '"' + safeToEmbedString(expr) + '"';
        }
        return ("" + expr);
    }
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
        if( expr.operator === "~" ||
            expr.operator === "-" ||
            expr.operator === "+" ) {
            return expr.operator + nodeToString( expr.argument );
        }
        return "(" + expr.operator + " " + nodeToString( expr.argument ) + ")";
    }
    else if( expr.type === "Literal" ) {
        return expr.raw;
    }
    else if( expr.type === "BinaryExpression" || expr.type === "LogicalExpression" ) {
        return "("+nodeToString(expr.left) + " " +
            expr.operator + " " +
            nodeToString(expr.right) + ")";
    }
    else if( expr.type === "ThisExpression" ) {
        return "this";
    }
    else if( expr.type === "ObjectExpression") {
        var props = expr.properties;
        var ret = [];
        for( var i = 0, len = props.length; i < len; ++i ) {
            var prop = props[i];
            ret.push( nodeToString(prop.key) + ": " + nodeToString(prop.value));
        }
        return "({"+ret.join(",\n")+"})";
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
    else if( expr.type === "FunctionExpression" ) {
        var params = [];
        for( var i = 0, len = expr.params.length; i < len; ++i ) {
            params.push( nodeToString(expr.params[i]) );
        }
    }
    else if( expr.type === "BlockStatement" ) {
        var tmp  = [];
        for( var i = 0, len = expr.body.length; i < len; ++i ) {
            tmp.push( nodeToString(expr.body[i]) );
        }
        return tmp.join(";\n");
    }
    else if( expr.type === "CallExpression" ) {
        var args = [];
        for( var i = 0, len = expr.arguments.length; i < len; ++i ) {
            args.push( nodeToString(expr.arguments[i]) );
        }
        return nodeToString( expr.callee ) + "("+args.join(",")+")";
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

function Assertion( expr, exprStr, start, end ) {
    this.expr = expr;
    this.exprStr = exprStr;
    this.start = start;
    this.end = end;
}
Assertion.prototype.toString = function() {
    return 'ASSERT('+nodeToString(this.expr)+',\n    '+this.exprStr+')';
};

function BitFieldRead(mask, start, end, fieldExpr) {
    if (mask === 0) throw new Error("mask cannot be zero");
    this.mask = mask;
    this.start = start;
    this.end = end;
    this.fieldExpr = fieldExpr;
}

BitFieldRead.prototype.getShiftCount = function() {
    var b = 1;
    var shiftCount = 0;
    while ((this.mask & b) === 0) {
        b <<= 1;
        shiftCount++;
    }
    return shiftCount;
};

BitFieldRead.prototype.toString = function() {
    var fieldExpr = this.fieldExpr ? nodeToString(this.fieldExpr) : "bitField";
    var mask = this.mask;
    var shiftCount = this.getShiftCount();
    return shiftCount === 0
        ? "(" + fieldExpr + " & " + mask + ")"
        : "((" + fieldExpr + " & " + mask + ") >>> " + shiftCount + ")";
};

function BitFieldCheck(value, inverted, start, end, fieldExpr) {
    this.value = value;
    this.inverted = inverted;
    this.start = start;
    this.end = end;
    this.fieldExpr = fieldExpr;
}

BitFieldCheck.prototype.toString = function() {
    var fieldExpr = this.fieldExpr ? nodeToString(this.fieldExpr) : "bitField";
    var equality = this.inverted ? "===" : "!==";
    return "((" + fieldExpr + " & " + this.value + ") " + equality + " 0)";
};

function InlineSlice(varExpr, collectionExpression, startExpression, endExpression, start, end, isBrowser,
                    pad) {
    this.varExpr = varExpr;
    this.collectionExpression = collectionExpression;
    this.startExpression = startExpression;
    this.endExpression = endExpression;
    this.start = start;
    this.end = end;
    this.isBrowser = isBrowser;
    this.pad = typeof pad === "number" ? pad : 0;
}

InlineSlice.prototype.hasSimpleStartExpression =
function InlineSlice$hasSimpleStartExpression() {
    return this.startExpression.type === "Identifier" ||
        this.startExpression.type === "Literal";
};

InlineSlice.prototype.hasSimpleEndExpression =
function InlineSlice$hasSimpleEndExpression() {
    return this.endExpression.type === "Identifier" ||
        this.endExpression.type === "Literal";
};

InlineSlice.prototype.hasSimpleCollection = function InlineSlice$hasSimpleCollection() {
    return this.collectionExpression.type === "Identifier";
};

InlineSlice.prototype.toString = function InlineSlice$toString() {
    var pad = this.pad;

    var init = this.hasSimpleCollection()
        ? ""
        : "var $_collection = " + nodeToString(this.collectionExpression) + ";";

    var collectionExpression = this.hasSimpleCollection()
        ? nodeToString(this.collectionExpression)
        : "$_collection";

    init += "var $_len = " + collectionExpression + ".length";

    if (pad !== 0) {
        init += " + " + Math.abs(pad) + ";";
    } else {
        init += ";";
    }

    var varExpr = nodeToString(this.varExpr);

    //No offset arguments at all
    if( this.startExpression === firstElement ) {
        if (this.isBrowser) {
            if (pad > 0) {
                return "var " + varExpr + " = (new Array("+pad+")).concat([].slice.call("+collectionExpression+"));";
            } else if (pad < 0) {
                return "var " + varExpr + " = ([].slice.call("+collectionExpression+")).concat(new Array("+Math.abs(pad)+"));";
            } else {
                return "var " + varExpr + " = [].slice.call("+collectionExpression+");";
            }
        } else {
            var startVal = pad > 0 ? String(pad) : "0";
            var collectionExpressionVal = pad > 0 ? " - " + pad : "";
            var lenVal = pad < 0 ? "- " + Math.abs(pad) : "";

            return init + "var " + varExpr + " = new Array($_len); " +
            "for(var $_i = " + startVal + "; $_i < $_len " + lenVal + "; ++$_i) {" +
                    varExpr + "[$_i] = " + collectionExpression + "[$_i " + collectionExpressionVal + "];" +
            "}";
        }

    }
    else {
        if( !this.hasSimpleStartExpression() ) {
            init += "var $_start = " + nodeToString(this.startExpression) + ";";
        }
        var startExpression = this.hasSimpleStartExpression()
            ? nodeToString(this.startExpression)
            : "$_start";

            //Start offset argument given
        if( this.endExpression === lastElement ) {
            if (this.isBrowser) {
                return "var " + varExpr + " = [].slice.call("+collectionExpression+", "+startExpression+");";
            } else {
                return init + "var " + varExpr + " = new Array(Math.max($_len - " +
                 startExpression + ", 0)); " +
                "for(var $_i = " + startExpression + "; $_i < $_len; ++$_i) {" +
                        varExpr + "[$_i - "+startExpression+"] = " + collectionExpression + "[$_i];" +
                "}";
            }
        }
            //Start and end offset argument given
        else {

            if( !this.hasSimpleEndExpression() ) {
                init += "var $_end = " + nodeToString(this.endExpression) + ";";
            }
            var endExpression = this.hasSimpleEndExpression()
                ? nodeToString(this.endExpression)
                : "$_end";

            if (this.isBrowser) {
                return "var " + varExpr + " = [].slice.call("+collectionExpression+", "+startExpression+", "+endExpression+");";
            } else {
                return init + "var " + varExpr + " = new Array(Math.max(" + endExpression + " - " +
                 startExpression + ", 0)); " +
                "for(var $_i = " + startExpression + "; $_i < " + endExpression + "; ++$_i) {" +
                        varExpr + "[$_i - "+startExpression+"] = " + collectionExpression + "[$_i];" +
                "}";
            }

        }

    }
};

var opts = {
    ecmaVersion: 5,
    strictSemicolons: false,
    allowTrailingCommas: true,
    forbidReserved: false,
    locations: false,
    onComment: null,
    ranges: false,
    program: null,
    sourceFile: null
};

var rlineterm = /[\r\n\u2028\u2029]/;
var rhorizontalws = /[ \t]/;

var convertSrc = function( src, results ) {
    if( results.length ) {
        results.sort(function(a, b){
            var ret = a.start - b.start;
            if( ret === 0 ) {
                ret = a.end - b.end;
            }
            return ret;
        });
        for( var i = 1; i < results.length; ++i ) {
            var item = results[i];
            if( item.start === results[i-1].start &&
                item.end === results[i-1].end ) {
                results.splice(i++, 1);
            }
        }
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
};

var rescape = /[\r\n\u2028\u2029"]/g;

var replacer = function( ch ) {
        return "\\u" + (("0000") +
            (ch.charCodeAt(0).toString(16))).slice(-4);
};

function safeToEmbedString( str ) {
    return str.replace( rescape, replacer );
}

function parse( src, opts, fileName) {
    if( !fileName ) {
        fileName = opts;
        opts = void 0;
    }
    try {
        return jsp.parse(src, opts);
    }
    catch(e) {
        e.message = e.message + " " + fileName;
        e.scriptSrc = src;
        throw e;
    }
}

var inlinedFunctions = Object.create(null);

var lastElement = jsp.parse("___input.length").body[0].expression;
var firstElement = jsp.parse("0").body[0].expression;

inlinedFunctions.INLINE_SLICE = function( node, isBrowser ) {
    var statement = node;
    node = node.expression;
    var args = node.arguments;

    if( !(2 <= args.length && args.length <= 4 ) ) {
        throw new Error("INLINE_SLICE must have exactly 2, 3 or 4 arguments");
    }

    var varExpression = args[0];
    var collectionExpression = args[1];
    var startExpression = args.length < 3
        ? firstElement
        : args[2];
    var endExpression = args.length < 4
        ? lastElement
        : args[3];
    return new InlineSlice(varExpression, collectionExpression,
        startExpression, endExpression, statement.start, statement.end, isBrowser);
};

inlinedFunctions.INLINE_SLICE_LEFT_PADDED = function( node, isBrowser ) {
    var statement = node;
    node = node.expression;
    var args = node.arguments;

    if(args.length !== 3) {
        throw new Error("INLINE_SLICE_LEFT_PADDED must have exactly 3 arguments");
    }

    var padCount = Number(nodeToString(args[0]));
    var varExpression = args[1];
    var collectionExpression = args[2];
    var startExpression = firstElement;
    var endExpression = lastElement;
    return new InlineSlice(varExpression, collectionExpression,
        startExpression, endExpression, statement.start, statement.end, isBrowser, padCount);
};

inlinedFunctions.BIT_FIELD_READ = function(node) {
    var statement = node;
    var args = node.expression.arguments;
    if (args.length !== 1 && args.length !== 2) {
        throw new Error("BIT_FIELD must have 1 or 2 arguments");
    }
    var arg = args[0];
    if (arg.type !== "Identifier") {
        throw new Error("BIT_FIELD argument must be an identifier");
    }
    var name = arg.name;
    var constant = constants[name];
    if (constant === undefined) {
        throw new Error(name + " is not a constant");
    }
    var value = constant.value;
    return new BitFieldRead(value, statement.start, statement.end, args[1]);
};
inlinedFunctions.BIT_FIELD_CHECK = function(node) {
    var statement = node;
    var args = node.expression.arguments;
    if (args.length !== 1 && args.length !== 2) {
        throw new Error("BIT_FIELD must have 1 or 2 arguments");
    }
    var arg = args[0];
    if (arg.type !== "Identifier") {
        throw new Error("BIT_FIELD argument must be an identifier");
    }
    var name = arg.name;
    var constant = constants[name];
    if (constant === undefined) {
        throw new Error(name + " is not a constant");
    }
    var value = constant.value;
    var inverted = false;
    if (name.slice(-4) === "_NEG") {
        inverted = true;
    }
    return new BitFieldCheck(value, inverted, statement.start, statement.end, args[1]);
};
inlinedFunctions.USE = function(node) {
    return new Empty(node.start, node.end);
};

var constants = {};
var ignore = [];
Error.stackTraceLimit = 10000;
var astPasses = module.exports = {

    inlineExpansion: function( src, fileName, isBrowser ) {
        var ast = parse(src, fileName);
        var results = [];
        var expr = [];
        function doInline(node) {
            if( node.expression.type !== 'CallExpression' ) {
                return;
            }

            var name = node.expression.callee.name;

            if(typeof inlinedFunctions[ name ] === "function" &&
                expr.indexOf(node.expression) === -1) {
                expr.push(node.expression);
                try {
                    results.push( inlinedFunctions[ name ]( node, isBrowser ) );
                }
                catch(e) {
                    e.fileName = fileName;
                    throw e;
                }

            }
        }
        walk.simple(ast, {
            ExpressionStatement: doInline,
            CallExpression: function(node) {
                node.expression = node;
                doInline(node);
            }
        });
        var ret = convertSrc( src, results );
        return ret;
    },

    //Parse constants in from constants.js
    readConstants: function( src, fileName ) {
        var ast = parse(src, fileName);
        walk.simple(ast, {
            ExpressionStatement: function( node ) {
                if( node.expression.type !== 'CallExpression' ) {
                    return;
                }

                var start = node.start;
                var end = node.end;
                node = node.expression;
                var callee = node.callee;
                if( callee.name === "CONSTANT" &&
                    callee.type === "Identifier" ) {

                    if( node.arguments.length !== 2 ) {
                        throw new Error( "Exactly 2 arguments must be passed to CONSTANT\n" +
                            src.substring(start, end)
                        );
                    }

                    if( node.arguments[0].type !== "Identifier" ) {
                        throw new Error( "Can only define identifier as a constant\n" +
                            src.substring(start, end)
                        );
                    }

                    var args = node.arguments;

                    var name = args[0];
                    var nameStr = name.name;
                    var expr = args[1];

                    var e = eval;
                    constants[nameStr] = {
                        identifier: name,
                        value: e(nodeToString(expr))
                    };
                    walk.simple( expr, {
                        Identifier: function( node ) {
                            ignore.push(node);
                        }
                    });
                    global[nameStr] = constants[nameStr].value;
                }
            }
        });
    },

    //Expand constants in normal source files
    expandConstants: function( src, fileName ) {
        var results = [];
        var identifiers = [];
        var ast = parse(src, fileName);
        walk.simple(ast, {
            Identifier: function( node ) {
                identifiers.push( node );
            }
        });

        for( var i = 0, len = identifiers.length; i < len; ++i ) {
            var id = identifiers[i];
            if( ignore.indexOf(id) > -1 ) {
                continue;
            }
            var constant = constants[id.name];
            if( constant === void 0 ) {
                continue;
            }
            if( constant.identifier === id ) {
                continue;
            }

            results.push( new ConstantReplacement( constant.value, id.start, id.end ) );

        }
        return convertSrc( src, results );
    },

    removeComments: function( src, fileName ) {
        var results = [];
        var rnoremove = /^[*\s\/]*(?:@preserve|jshint|global)/;
        opts.onComment = function( block, text, start, end ) {
            if( rnoremove.test(text) ) {
                return;
            }
            var e = end + 1;
            var s = start - 1;
            while(rhorizontalws.test(src.charAt(s--)));
            while(rlineterm.test(src.charAt(e++)));
            results.push( new Empty( s + 2, e - 1 ) );
        };
        var ast = parse(src, opts, fileName);
        return convertSrc( src, results );
    },

    expandAsserts: function( src, fileName ) {
        var ast = parse( src, fileName );
        var results = [];
        walk.simple(ast, {
            CallExpression: function( node ) {

                var start = node.start;
                var end = node.end;
                var callee = node.callee;

                if( callee.type === "Identifier" &&
                    callee.name === "ASSERT" ) {
                    if( node.arguments.length !== 1 ) {
                        results.push({
                            start: start,
                            end: end,
                            toString: function() {
                                return src.substring(start, end);
                            }
                        });
                        return;
                    }

                    var expr = node.arguments[0];
                    var str = src.substring(expr.start, expr.end);
                    str = '"' + safeToEmbedString(str) + '"'
                    var assertion = new Assertion( expr, str, start, end );

                    results.push( assertion );
                }
            }
        });
        return convertSrc( src, results );
    },

    removeAsserts: function( src, fileName ) {
        var ast = parse( src, fileName );
        var results = [];
        walk.simple(ast, {
            ExpressionStatement: function( node ) {
                if( node.expression.type !== 'CallExpression' ) {
                    return;
                }
                var start = node.start;
                var end = node.end;
                node = node.expression;
                var callee = node.callee;

                if( callee.type === "Identifier" &&
                    callee.name === "ASSERT" ) {
                    var e = end + 1;
                    var s = start - 1;

                    while(rhorizontalws.test(src.charAt(s--)));
                    while(rlineterm.test(src.charAt(e++)));
                    results.push( new Empty( s + 2, e - 1) );
                }
            },
            VariableDeclaration: function(node) {
                var start = node.start;
                var end = node.end;
                if (node.kind === 'var' && node.declarations.length === 1) {
                    var decl = node.declarations[0];
                    if (decl.id.type === "Identifier" &&
                        decl.id.name === "ASSERT") {
                        var e = end + 1;
                        var s = start - 1;
                        while(rhorizontalws.test(src.charAt(s--)));
                        while(rlineterm.test(src.charAt(e++)));
                        results.push( new Empty( s + 2, e - 1) );
                    }
                }
            }
        });
        return convertSrc( src, results );
    },

    asyncConvert: function( src, objName, fnProp, fileName ) {
        var ast = parse( src, fileName );

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
        return convertSrc( src, results );
    }
};
