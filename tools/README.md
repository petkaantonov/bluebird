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

###jshintrc_generator.js

Generates a .jshintrc file in the project root.

Example:

    node tools/jshintrc_generator

###changelog_generator.js

Generates changelog.md file with entries based on git history. Newly created entries will not contain
any useful logs, they must be manually edited in afterwards.

Example:

    node tools/changelog_generator
