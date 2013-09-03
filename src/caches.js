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

    rescape = /[\r\n\u2028\u2029']/g,

    replacer = function( ch ) {
        return "\\u" + (("0000") +
            (ch.charCodeAt(0).toString(16))).slice(-4);
    },

    hasProp = {}.hasOwnProperty;

function getGetter( propertyName ) {
    if( hasProp.call( getterCache, propertyName ) ) {
        return getterCache[propertyName];
    }
    //The cache is intentionally broken for silly properties
    //that contain newlines or quotes or such
    propertyName = (""+propertyName).replace( rescape, replacer );
    var fn = new Function("obj", "return obj['"+propertyName+"'];");
    getterCache[propertyName] = fn;
    return fn;
}

function getFunction( propertyName ) {
    if( hasProp.call( getterCache, propertyName ) ) {
        return functionCache[propertyName];
    }
    propertyName = (""+propertyName).replace( rescape, replacer );
    var fn = new Function("obj", "return obj['"+propertyName+"']();");
    getterCache[propertyName] = fn;
    return fn;
}