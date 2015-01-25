#READ BEFORE CREATING A NEW ISSUE

The issue tracker is for bug reports and feature requests. If you'd like help with a usage question please use [the [bluebird] tag in Stack Overflow](http://stackoverflow.com/tags/bluebird) and ask there. The tag is monitored regularly. You may also discuss things that are out of scope for the issue tracker on the [mailing list](https://groups.google.com/forum/#!forum/bluebird-js).


# Contributing to bluebird

1. [Directory structure](#directory-structure)
2. [Style guide](#style-guide)
3. [Testing](#testing)

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

## Testing

Make sure that all the tests run before and after you make your additions. Look in the [testing section in README.md](https://github.com/petkaantonov/bluebird#testing) for how to run the tests. Add relevant new tests.

