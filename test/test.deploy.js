var os = require('os');
var fs = require('fs');

var should = require('should');
var testing = require('../testing.json');
var create = require('../bin/create.js');
var deploy = require('../bin/deploy.js');
var async = require('async');
var logger = require('jslogging');

try {
  var settings = require('../settings.json');
}
catch(err) {
  logger.warn('No settings file found, using default settings...');
  var settings = require('../settings_template.json');
}

// Set up test variables
var savedworkingdirectory = process.cwd();
var currentworkingdirectory;
var temppath = os.tmpdir() + '/';
var testproject = "TestProject";

function rmDir(dirPath) {
	try { 
		var files = fs.readdirSync(dirPath); 
	}
	catch(e) { 
		return; 
	}
	if (files.length > 0) {
		for (var i = 0; i < files.length; i++) {
			var filePath = dirPath + '/' + files[i];
			if (fs.statSync(filePath).isFile())
				fs.unlinkSync(filePath);
			else
				rmDir(filePath);
		}
		fs.rmdirSync(dirPath);
	}
};

suite('DeploySuite', function() {
	setup(function() {
		// Switch directory to a temp directory
		process.chdir(temppath + testproject);
		logger.setLogLevel(-1);
	});
	
	test('Deploy index view', function(done) {
		async.series([
			function(cb) {
				deploy(['index'], settings, function(testing_code) {
					testing_code.should.equal(testing.nirodhaManager.viewdeployed);
					cb();
				});
			}
		], function() {
			done();
		});
	});

	test('Deploy newview view', function(done) {
		async.series([
			function(cb) {
				deploy(['newview'], settings, function(testing_code) {
					testing_code.should.equal(testing.nirodhaManager.viewdeployed);
					cb();
				});
			}
		], function() {
			done();
		});
	});

	test('Deploy newview view when directories are missing', function(done) {
		async.series([
			function(cb) {
				rmDir('deploy');
				deploy(['newview'], settings, function(testing_code) {
					testing_code.should.equal(testing.nirodhaManager.viewdeployed);
					cb();
				});
			}
		], function() {
			done();
		});
	});

	test('Deploy index view with static content', function(done) {
		async.series([
			function(cb) {
				fs.writeFileSync('custom/static/staticfile.html', 'Nothing here!');
				cb();
			},
			function(cb) {
				deploy(['index'], settings, function(testing_code) {
					testing_code.should.equal(testing.nirodhaManager.viewdeployed);
					cb();
				});
			}
		], function() {
			fs.unlinkSync('custom/static/staticfile.html');
			done();
		});
	});

	test('Deploy index view with static folders', function(done) {
		async.series([
			function(cb) {
				fs.writeFileSync('custom/static/staticfile.html', 'Nothing here!');
				fs.mkdirSync('custom/static/folder');
				fs.writeFileSync('custom/static/folder/staticfile.html', 'Nothing here!');
				cb();
			},
			function(cb) {
				deploy(['index'], settings, function(testing_code) {
					testing_code.should.equal(testing.nirodhaManager.viewdeployed);
					cb();
				});
			}
		], function() {
			fs.unlinkSync('custom/static/staticfile.html');
			fs.unlinkSync('custom/static/folder/staticfile.html', 'Nothing here!');
			fs.rmdirSync('custom/static/folder');
			done();
		});
	});

	test('Deploy all Views', function(done) {
		async.series([
			function(cb) {
				rmDir('deploy');
				deploy([], settings, function(testing_code) {
					testing_code.should.equal(testing.nirodhaManager.viewdeployed);
					cb();
				});
			}
		], function() {
			done();
		});
	});

});