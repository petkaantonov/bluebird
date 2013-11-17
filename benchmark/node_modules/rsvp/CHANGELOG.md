# master

# 2.0.4

* Fix npm package

# 2.0.3

* Fix useSetTimeout bug

# 2.0.2

* Adding RSVP#rethrow
* add pre-built AMD link to README
* adding promise#fail

# 2.0.1
* misc IE fixes, including IE array detection
* upload passing builds to s3
* async: use three args for addEventListener
* satisfy both 1.0 and 1.1 specs
* Run reduce tests only in node
* RSVP.resolve now simply uses the internal resolution procedure
* prevent multiple promise resolutions
* simplify thenable handling
* pre-allocate the deferred's shape
* Moved from Rake-based builds to Grunt
* Fix Promise subclassing bug
* Add RSVP.configure('onerror')
* Throw exception when RSVP.all is called without an array
* refactor RSVP.all to just use a promise directly
* Make `RSVP.denodeify` pass along `thisArg`
* add RSVP.reject
* Reject promise if resolver function throws an exception
* add travis build-status
* correctly test and fix self fulfillment
* remove promise coercion.
* Fix infinite recursion with deep self fulfilling promises
* doc fixes 

# 2.0.0

* No changelog beyond this point. Here be dragons.
