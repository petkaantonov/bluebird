function GetterCache(){}
function FunctionCache(){}


//If one uses sensible property names
//then the dummy constructor will give
//currently 8 more inobject properteis than
//EMPTY object literal in V8

//In other words, Promise.prototype.get
//is optimized for applications that use it
//for 1-8 properties that have identifier names
var getterCache = new GetterCache(),
    functionCache = new FunctionCache(),
    rjsident = /^[a-zA-Z$_][a-zA-Z0-9$_]*$/,
    rkeyword = new RegExp(
        "^(?:__proto__|undefined|NaN|Infinity|this|false|true|null|eval|" +
        "arguments|break|case|catch|continue|debugger|default|delete|do|" +
        "else|finally|for|function|if|in|instanceof|new|return|switch|th" +
        "row|try|typeof|var|void|while|with|class|enum|export|extends|im" +
        "port|super|implements|interface|let|package|private|protected|pu" +
        "blic|static|yield)$"
    ),
    hasProp = {}.hasOwnProperty;



function isJsIdentifier( val ) {
    return rjsident.test(val) &&
        !rkeyword.test(val);
}

function formatPropertyRead( val ) {
    if( isJsIdentifier(val) ) {
        return "." + val;
    }
    else {
        return "['"+safeToEmbedString(val)+"']";
    }
}

function getGetter( propertyName ) {
    if( hasProp.call( getterCache, propertyName ) ) {
        return getterCache[propertyName];
    }
    var fn = new Function("obj", "return obj"+
        formatPropertyRead(""+propertyName)
    +";");
    getterCache[propertyName] = fn;
    return fn;
}

function getFunction( propertyName ) {
    if( hasProp.call( functionCache, propertyName ) ) {
        return functionCache[propertyName];
    }
    var fn = new Function("obj", "return obj"+
        formatPropertyRead(""+propertyName)
    +"();");
    functionCache[propertyName] = fn;
    return fn;
}