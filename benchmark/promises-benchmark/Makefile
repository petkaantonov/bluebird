initialise:
	rm -rf fixtures
	mkdir fixtures
	mkdir fixtures/files
	tools/generate-files.sh

benchmark:
	node scenarios/serial/index.js
	node scenarios/light-serial/index.js
	node scenarios/parallel/index.js

benchmark-harmony:
	node --harmony-generators scenarios/serial/index.js
	node --harmony-generators scenarios/light-serial/index.js
	node --harmony-generators scenarios/parallel/index.js

.PHONY: benchmark
