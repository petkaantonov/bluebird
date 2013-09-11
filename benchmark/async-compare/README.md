# async-compare

This project aims compare various node.js async patterns by their

- complexity (number of necessary tokens)
- performance when executing in parallel (time and memory)
- debuggability 

The resulting analysis is available at 
[this blog post](http://spion.github.io/posts/analysis-generators-and-other-async-patterns-node.html)

## example problem

The problem is directly extracted from a DoxBee project. Its a typical if 
somewhat complex CRUD method executed when a user uploads a new document
to the database. It involves multiple queries to the database, a couple of 
selects, some inserts and one update. Lots of mixed sync/async action.

## files

Example solutions for all patterns are located in the `examples` directory

Non-js sorce files begin with `src-` (they're not checked for performance)

Compiled files are prefixed with `dst-` (they're not checked for complexity)

All other files are checked for both performance and complexity

## complexity

Complexity is measured by the number of tokens in the source code found by
Esprima's lexer (comments excluded)

Run `node complexity.js` to get complexity reports for all files.


## fakes.js

Wrappers can be added in `lib/fakes.js`

For examples, look at the promise and thunk wrappers for query methods.

Things that are specific to the upload function are not allowed here.


## performance

All external methods are mocked with setTimeout, to simulate waiting for I/O 
operations.

Performance is measured by performance.js
 
    node performance.js --n <parallel> --t <miliseconds> ./examples/*.js --harmony

where `n` is the number of parallel executions of the method, while `t` is the
time each simulated I/O operation should take, and `--harmony` enables
all features hidden behind the v8 flag.

There is an optional parameter `--file <file>` which will only test a single
file and report any encountered errors in detail:

    node --harmony performance.js --n 10000 --t 10 --file ./examples/genny.js

Also, this variant doesn't spawn a new process so which means additional
(v8) options can be passed to node.

If you omit `--n`, tests will be made with 100, 500, 1000 and 2000 parallel
requests and a giant JSON report (suitable for charts) will be generated.
    
    node performance.js --t 1 ./examples/*.js --harmony

If you omit `--n` *and* replace `--t` with `--dt`, I/O time `t` will grow with 
`n` by the formula `t = n * dt`

    node performance.js --dt 0.1 ./examples/*.js --harmony

Execution time and peak memory usage are reported.


## debuggability


`debuggability.js` measures the distance between the function that creates the 
error and the actual error in the stack trace. Reports "-" at places where
the stack trace is completely missing the original file.

To check all examples for async errors:

```
node debuggability.js --harmony --error 
```

and for exceptions:

```
node debuggability.js --harmony --throw
```

and finally for exceptions inside async calls (most things can't handle this):


```
node debuggability.js --harmony --athrow
```


## misc 

These are factors potentially important for collaboration which could
be added as points to arrive at a final score:

- does it require native modules (-2)
- does it require code transformation (-2) 
- will it eventually become available without code transformation (+1)


