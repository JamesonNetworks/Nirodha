var should = require('should');
var logger = require('../bin/logging.js');

suite('LoggerSuite', function() {
  test('Logger level should be set to 7', function() {
  	logger.setLogLevel(7);
	var currentloglevel = logger.getLogLevel();
	currentloglevel.should.be.exactly(7).and.be.a.Number;
  });
});