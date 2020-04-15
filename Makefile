install:
	npm ci
test:
	npm test
test_log:
	DEBUG=nock* npm test
build:
	npm run build
publish: build
	npm publish
