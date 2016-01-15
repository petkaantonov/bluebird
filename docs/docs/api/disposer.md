---
layout: api
id: disposer
title: .disposer
---


[← Back To API Reference](/docs/api-reference.html)
<div class="api-code-section"><markdown>
##.disposer

```js
.disposer(function(any resource, Promise usingOutcomePromise) disposer) -> Disposer
```

A meta method used to specify the disposer method that cleans up a resource when using `Promise.using`.

Returns a Disposer object which encapsulates both the resource as well as the method to clean it up. The user can pass this object to `Promise.using` to get access to the resource when it becomes available, as well as to ensure its automatically cleaned up.

The second argument passed to a disposer is the result promise of the using block, which you can inspect synchronously.

Example:

```js
// This function doesn't return a promise but a Disposer
// so it's very hard to use it wrong (not passing it to `using`)
function getConnection() {
    return db.connect().disposer(function(connection, promise) {
        connection.close();
    });
}
```

In the above example, the connection returned by `getConnection` can only be 
used via `Promise.using`, like so:

```js
function useConnection(query) {
  return Promise.using(getConnection(), function(connection) {
    return connection.sendQuery(query).then(function(results) {
      return process(results);
    })
  });
}
```

This will ensure that `connection.close()` will be called once the promise returned
from the `Promise.using` closure is resolved or if an exception was thrown in the closure
body.

Real example:

```js
var pg = require("pg");
// Uncomment if pg has not been properly promisified yet
//var Promise = require("bluebird");
//Promise.promisifyAll(pg, {
//    filter: function(methodName) {
//        return methodName === "connect"
//    },
//    multiArgs: true
//});
// Promisify rest of pg normally
//Promise.promisifyAll(pg);

function getSqlConnection(connectionString) {
    var close;
    return pg.connectAsync(connectionString).spread(function(client, done) {
        close = done;
        return client;
    }).disposer(function() {
        if (close) close();
    });
}

module.exports = getSqlConnection;
```

Real example 2:

```js
var mysql = require("mysql");
// Uncomment if pg has not been properly promisified yet
// var Promise = require("bluebird");
// Promise.promisifyAll(mysql);
// Promise.promisifyAll(require("mysql/lib/Connection").prototype);
// Promise.promisifyAll(require("mysql/lib/Pool").prototype);
var pool  = mysql.createPool({
    connectionLimit: 10,
    host: 'example.org',
    user: 'bob',
    password: 'secret'
});

function getSqlConnection() {
    return pool.getConnectionAsync().disposer(function(connection) {
        connection.release();
    });
}

module.exports = getSqlConnection;
```

#### Note about disposers in node

If a disposer method throws or returns a rejected promise, its highly likely that it failed to dispose of the resource. In that case, Bluebird has two options - it can either ignore the error and continue with program execution or throw an exception (crashing the process in node.js).

In bluebird we've chosen to do the latter because resources are typically scarce. For example, if a database connection cannot be disposed of and Bluebird ignores that, the connection pool will be quickly depleted and the process will become unusable (all requests that query the database will wait forever). Since Bluebird doesn't know how to handle that, the only sensible default is to crash the process. That way, rather than getting a useless process that cannot fulfill more requests, we can swap the faulty worker with a new one letting the OS clean up the resources for us.

As a result, if you anticipate thrown errors or promise rejections while disposing of the resource you should use a `try..catch` block (or Promise.try) and write the appropriate catch code to handle the errors. If its not possible to sensibly handle the error, letting the process crash is the next best option.

This also means that disposers should not contain code that does anything other than resource disposal. For example, you cannot write code inside a disposer to commit or rollback a transaction, because there is no mechanism for the disposer to signal a failure of the commit or rollback action without crashing the process.

For transactions, you can use the following similar pattern instead:

```js
function withTransaction(fn) {
  return Promise.using(pool.acquireConnection(), function(connection) {
    var tx = connection.beginTransaction()
    return Promise
      .try(fn, tx)
      .then(function(res) { return connection.commit().thenReturn(res) },
            function(err) {
              return connection.rollback()
                     .catch(function(e) {/* maybe add the rollback error to err */})
                     .thenThrow(err);
            });
  });
}

// If the withTransaction block completes successfully, the transaction is automatically committed
// Any error or rejection will automatically roll it back

withTransaction(function(tx) {
    return tx.queryAsync(...).then(function() {
        return tx.queryAsync(...)
    }).then(function() {
        return tx.queryAsync(...)
    });
});
```

<hr>
</markdown></div>

<div id="disqus_thread"></div>
<script type="text/javascript">
    var disqus_title = ".disposer";
    var disqus_shortname = "bluebirdjs";
    var disqus_identifier = "disqus-id-disposer";
    
    (function() {
        var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;
        dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
