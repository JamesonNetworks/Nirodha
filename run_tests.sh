cd bin
../node_modules/jshint/bin/jshint *.js 
cd ..
istanbul cover _mocha -- -u tdd -R spec
