var should = require('should');
try {
	var settings = require('../settings.json');
}
catch(err) {
	console.log('Error occured in log init, is there a settings.json file?');
}
var logger = require('../bin/logging.js');

suite('LoggerSuite', function() {

	test('Logger level should be set to 7', function() {
		logger.setLogLevel(7);
		var currentloglevel = logger.getLogLevel();
		currentloglevel.should.be.exactly(7).and.be.a.Number;
	});

	test('Test Emergency Logging', function() {
	  	logger.log('Test Emergency Statement', 0, function(statement) {
	  		statement.should.be.exactly('\u001b[31m[ 0, EMR ] : Test Emergency Statement\u001b[39m');
	  	});
	});

	test('Test Alert Logging', function() {
	  	logger.log('Test Alert Statement', 1, function(statement) {
	  		statement.should.be.exactly('\u001b[31m[ 1, ALT ] : Test Alert Statement\u001b[39m');
	  	});
	});

	test('Test Critical Logging', function() {
		logger.log('Test Critical Statement', 2, function(statement) {
	  		statement.should.be.exactly('\u001b[31m[ 2, CRT ] : Test Critical Statement\u001b[39m');
	  	});
	});

	test('Test Error Logging', function() {
		logger.log('Test Error Statement', 3, function(statement) {
	  		statement.should.be.exactly('\u001b[31m[ 3, ERR ] : Test Error Statement\u001b[39m');
	  	});
	});

	test('Test Warning Logging', function() {
	  	logger.log('Test Warning Statement', 4, function(statement) {
	  		statement.should.be.exactly('\u001b[33m[ 4, WRN ] : Test Warning Statement\u001b[39m');
	  	});
	});

	test('Test Notice Logging', function() {
		logger.log('Test Notice Statement', 5, function(statement) {
	  		statement.should.be.exactly('[ 5, NTC ] : Test Notice Statement');
	  	});
	});

	test('Test Info Logging', function() {
	  	logger.log('Test Info Statement', 6, function(statement) {
	  		statement.should.be.exactly('\u001b[32m[ 6, INF ] : Test Info Statement\u001b[39m');
	  	});
	});

	test('Test Debug Logging', function() {
	  	logger.log('Test Debug Statement', 7, function(statement) {
	  		statement.should.be.exactly('\u001b[36m[ 7, DBG ] : Test Debug Statement\u001b[39m');
	  	});
	});

	test('Test No Logging', function() {
	  	logger.log('Test No Logging', -1, function(statement) {
	  		statement.should.be.exactly('');
	  	});
	});
});