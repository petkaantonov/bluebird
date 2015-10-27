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


A meta method used to specify the disposer method that cleans up a resource when using undefined.

Example:

```js
// This function doesn't return a promise but a Disposer
// so it's very hard to use it wrong (not passing it to `using`)
function getConnection() {
    return pool.getConnectionAsync().disposer(function(connection, promise) {
        connection.close();
    });
}
```

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

The second argument passed to a disposer is the result promise of the using block, which you can inspect synchronously.

Example:

```js
function getTransaction() {
    return db.getTransactionAsync().disposer(function(tx, promise) {
        return promise.isFulfilled() ? tx.commitAsync() : tx.rollbackAsync();
    });
}


// If the using block completes successfully, the transaction is automatically committed
// Any error or rejection will automatically roll it back
using(getTransaction(), function(tx) {
    return tx.queryAsync(...).then(function() {
        return tx.queryAsync(...)
    }).then(function() {
        return tx.queryAsync(...)
    });
});
```

Real example 3, transactions with postgres:

```js
var pg = require('pg');
// uncomment if necessary
//var Promise = require("bluebird");
//Promise.promisifyAll(pg, {
//    filter: function(methodName) {
//        return methodName === "connect"
//    },
//    multiArgs: true
//});
// Promisify rest of pg normally
//Promise.promisifyAll(pg);

function getTransaction(connectionString) {
    var close;
    return pg.connectAsync(connectionString).spread(function(client, done) {
        close = done;
        return client.queryAsync('BEGIN').then(function () {
            return client;
        });
    }).disposer(function(client, promise) {
        if (promise.isFulfilled()) {
            return client.queryAsync('COMMIT').then(closeClient);
        } else {
            return client.queryAsync('ROLLBACK').then(closeClient);
        }
        function closeClient() {
            if (close) close(client);
        }
    });
}

exports.getTransaction = getTransaction;
```

#### Note about disposers in node

If a disposer method throws, its highly likely that it failed to dispose of the resource. In that case, Bluebird has two options - it can either ignore the error and continue with program execution or throw an exception (crashing the process in node.js). Bluebird prefers to do the later because resources are typically scarce. For example, if database connections cannot be disposed of and Bluebird ignores that, the connection pool will be quickly depleted and the process will become unusable. Since Bluebird doesn't know how to handle that, the only sensible default is to crash the process.

If you anticipate thrown errors while disposing of the resource you should use a `try..catch` block (or `Promise.try`) and write the appropriate code to handle the errors.

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