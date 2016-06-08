---
id: contribute
title: Contribute
---

For development tasks such as contributing, running benchmarks or testing, you need to clone the repository and install dev-dependencies.

Install [node](http://nodejs.org/)

    git clone git@github.com:petkaantonov/bluebird.git
    cd bluebird
    npm install

- [Directory structure](#directory-structure)
- [Style guide](#style-guide)
- [Building](#building)
    - [Supported options by the build tool](#supported-options-by-the-build-tool)
- [Testing](#testing)
    - [Testing in browsers](#testing-in-browsers)
    - [Supported options by the test tool](#supported-options-by-the-test-tool)
- [Benchmarking](#benchmarking)

## Directory structure

- `/benchmark` contains benchmark scripts and stats of benchmarks

- `/tools` contains building and testing tools and scripts

- `/src` contains the source code

- `/test` contains test code

    - `/test/mocha` contains tests using the mocha testing framework
    - `/test/browser` a directory that can be statically served using a webserver to run tests in browsers. See [testing in browsers](README.md#testing-in-browsers).


## Style guide

Use the same style as is used in the surrounding code.

###Whitespace

- No more than 80 columns per line
- 4 space indentation
- No trailing whitespace
- LF at end of files
- Curly braces can be left out of single statement `if/else/else if`s when it is obvious there will never be multiple statements such as null check at the top of a function for an early return.
- Add an additional new line between logical sections of code.

###Variables

- Use multiple `var` statements instead of a single one with comma separator. Do not declare variables until you need them.

###Equality and type checks

- Always use `===` except when checking for null or undefined. To check for null or undefined, use `x == null`.
- For checks that can be done with `typeof`: do not make helper functions, save results of `typeof` to a variable or make the type string a non-constant. Always write the check in the form `typeof expression === "constant string"` even if it feels like repeating yourself.

##Building

```
node tools/build --debug --release --zalgo --browser --minify
```

###Supported options by the build tool

The value of boolean flags is determined by presence, if you want to pass false value for a boolean flag, use the `no-`-prefix e.g. `--no-debug`.

 - `--release` - Whether to build the release build. The release build is placed at `js/release` directory. Default `false`.
 - `--debug` - Whether to build the debug build. The debug build is placed at `js/debug` directory. Default `false`.
 - `--zalgo` - Whether to build the zalgo build. The zalgo build is placed at `js/zalgo` directory. Default `false`.
 - `--browser` - Whether to compile the browser build. The browser build file is placed at `js/browser/bluebird.js` Default `false`.
 - `--minify` - Whether to minify the compiled browser build. The minified browser build file is placed at `js/browser/bluebird.min.js` Default `true`.

##Testing

To run all tests, run

    node tools/test

If you need to run generator tests in older versions of NodeJS run the `tool/test.js` script with `--harmony` argument and 0.11+:

    node-dev --harmony tools/test

In recent versions of NodeJS where generators are enabled by default:

    node tools/test

You may specify an individual test file to run with the `--run` script flag:

    node tools/test --run=cancel.js


This enables output from the test and may give a better idea where the test is failing. The paramter to `--run` can be any file name located in `test/mocha` folder.

###Testing in browsers

To run the test in a browser instead of node, pass the flag `--browser` to the test tool

    node tools/test --run=cancel.js --browser

This will automatically create a server (default port 9999) and open it in your default browser once the tests have been compiled.

Keep the test tab active because some tests are timing-sensitive and will fail if the browser is throttling timeouts. Chrome will do this for example when the tab is not active.

###Supported options by the test tool

The value of boolean flags is determined by presence, if you want to pass false value for a boolean flag, use the `no-`-prefix e.g. `--no-browser`.

 - `--run=String`. Which tests to run (or compile when testing in browser). Default `"all"`. Can also be a glob string (relative to ./test/mocha folder)
 - `--cover=String`. Create code coverage using the String as istanbul reporter. Coverage is created in the ./coverage folder. No coverage is created by default, default reporter is `"html"` (use `--cover` to use default reporter).
 - `--browser` - Whether to compile tests for browsers. Default `false`.
 - `--port=Number` - Whe port where local server is hosted when testing in browser. Default `9999`
 - `--execute-browser-tests` - Whether to execute the compiled tests for browser when using `--browser`. Default `true`.
 - `--open-browser` - Whether to open the default browser when executing browser tests. Default `true`.
 - `--fake-timers` - Whether to use fake timers (`setTimeout` etc) when running tests in node. Default `true`.
 - `--js-hint` - Whether to run JSHint on source files. Default `true`.
 - `--saucelabs` Wheter to create a tunnel to sauce labs and run tests in their VMs instead of your browser when compiling tests for browser.Default `false`.

##Benchmarking

To run a benchmark, run the given command for a benchmark while on the project root. Requires bash (on windows the mingw32 that comes with git works fine too).

Each benchmark must

 - Have implementations that do the same thing
 - Run each implementation of a benchmark in a separate freshly created process
 - Warmup each implementation before timing

###1\. DoxBee sequential

Currently the most relevant benchmark is @gorkikosev's benchmark in the article [Analysis of generators and other async patterns in node](http://spion.github.io/posts/analysis-generators-and-other-async-patterns-node.html). The benchmark emulates a situation where n amount of users are making a request in parallel to execute some mixed async/sync action.

Command: `bench doxbee`

The implementations for this benchmark are found in `benchmark/doxbee-sequential` directory.

###2\. Parallel

This made-up scenario runs 25 shimmed queries in parallel.

Command: `bench parallel`

The implementations for this benchmark are found in `benchmark/madeup-parallel` directory.
