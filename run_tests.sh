cd bin
../node_modules/jshint/bin/jshint *.js 
cd ..
mocha -R spec -u tdd --recursive -R xunit test/
istanbul cover _mocha -- -u tdd -R spec
