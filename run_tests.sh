cd bin
../node_modules/jshint/bin/jshint *.js 
cd ..
mocha -R spec -u tdd --recursive -R xunit test/ > test-reports.xml
istanbul cover ./node_modules/mocha/bin/_mocha --report lcovonly -- -u tdd -R spec && cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js && rm -rf ./coverage