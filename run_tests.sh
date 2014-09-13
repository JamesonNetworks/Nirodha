cd bin
../node_modules/jshint/bin/jshint *.js 
cd ..
mocha -R spec -u tdd --recursive -R xunit test/ > test-reports.xml
istanbul cover _mocha -- -u tdd -R spec
