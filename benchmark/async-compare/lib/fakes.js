

var fakemaker = require('./fakemaker'),
    f = require('./dummy');

fakemaker(f.dummy, f.dummyt, function wrap_identity(f) { return f; });


