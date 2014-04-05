var os = require('os');
var fs = require('fs');

var should = require('should');
var testing = require('../testing.json');
var create = require('../bin/create.js');
var deploy = require('../bin/deploy.js');
var async = require('async');

// Set up test variables
var savedworkingdirectory = process.cwd();
var currentworkingdirectory;
var temppath = os.tmpdir();
var testproject = "TestProject";

suite('DeploySuite', function() {
	setup(function() {
		// Switch directory to a temp directory
		process.chdir(temppath + testproject);
	});
	
	test('Deploy index view', function(done) {
		async.series([
			function(cb) {
				deploy(['index'], function(testing_code) {
					testing_code.should.equal(testing.deploysuite.viewdeployed);
				});
				cb();
			}
		], function() {
			done();
		});
	});
});