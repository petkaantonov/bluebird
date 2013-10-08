
exports.longStackSupport = global.longStackSupport;


function invoke(ctx, cb, value, myhandler) {            
    try {
        cb.call(ctx, value); // no error
    } catch (e) {
        if (myhandler)
            myhandler.call(ctx, e);
        else
            console.error(e);
    }
}

module.exports = function() {
    var self = {};
    var notCaught = true, myhandler;
    self.try = function $try(cb) {
        if (exports.longStackSupport) {
            var ex = {};
            Error.captureStackTrace(ex);
        }
        return function wrapper(err, value) {
            if (err) {
               if (notCaught) {
                   notCaught = false;
                   if (err.stack && ex) {
                       var asyncStackRaw =
                           ex.stack.substr(ex.stack.indexOf('\n'));
                       err.stack += '\nFrom previous event:' 
                           + asyncStackRaw;
                   }
                   if (myhandler) myhandler(err);
                   else console.error(err);
               }
            }
            else if (myhandler) 
                invoke(this, cb, value, myhandler);
            else cb(value);
        }
    }
    self.catch = function $catch(handler) {
        myhandler = handler
    };
    return self;
};

