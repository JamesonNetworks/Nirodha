var should = require('should');
try {
	var settings = require('../settings.json');
}
catch(err) {
	console.log('Error occured in log init, is there a settings.json file? Using defaults for test...');
	settings = {};
	settings.path_to_nirodha = '.';
	settings.port = 3000;
	settings.log_level = 6;
}

suite('Settings Suite', function() {
	test('Test Settings.js exists', function() {
		settings.should.not.be.empty;
	});

	test('Path should be a string', function() {
		settings.path_to_nirodha.should.be.a.string;
	});

	test('Port should be a number and between 1 and 65535',function() {
		settings.port.should.be.a.number;
		settings.port.should.be.above(0).and.below(65536);
	});

	test('Log level should be a number and between 0 and 7',function() {
		settings.log_level.should.be.a.number;
		settings.log_level.should.be.above(-1).and.below(8);
	});
});