##Tools

Tools that can be run from command line:

###test.js

For running tests. See [Testing](../#testing).

###build.js

For building the library. See [Custom builds](../#custom-builds).

###api_menu_generator.js

Generates the API.md menu on stdout.

Example:

    node tools/api_menu_generator

###bump.js

Increments the project's version. Second argument must be `major`, `minor` or `patch`. The increment
is based on what is read from `package.json`.

Running the script successfully will:

 - Increment the `version` property in the `bower.json` and `package.json` files
 - Stage all files in index (should be just `bower.json` and `package.json`)
 - Commit all staged files with message "Release vx.x.x"
 - Create a tag `vx.x.x` that points to the commit created in previous step

Example:

    node tools/bump patch

###jshintrc_generator.js

Generates a .jshintrc file in the project root.

Example:

    node tools/jshintrc_generator

###changelog_generator.js

Generates changelog.md file with entries based on git history. Newly created entries will not contain
any useful logs, they must be manually edited in afterwards.

Example:

    node tools/changelog_generator
