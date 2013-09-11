
exports.longStackSupport = global.longStackSupport;

module.exports = function() {
    var self = {};
    var notCaught = true, myhandler;
    self.try = function(cb) {
        if (exports.longStackSupport) try {
            throw new Error();
        } catch (e) {
            var asyncStack = 
                e.stack.substr(e.stack.indexOf('\n'));
        }
        return function(err, value) {
            if (err) 
               if (notCaught) {
                   if (err.stack && asyncStack)
                       err.stack += '\nFrom previous event:' 
                                 + asyncStack;
                   if (myhandler) 
                       myhandler(err);
                   else 
                       throw err;
               }
               else {} // caught
            else cb(value); // no error
        }
    }
    self.catch = function(handler) {
        myhandler = handler
    };
    return self;
};

