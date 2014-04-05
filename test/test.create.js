var os = require('os');
var fs = require('fs');

var should = require('should');
var testing = require('../testing.json');
var create = require('../bin/create.js');
var async = require('async');

// Set up test variables
var savedworkingdirectory = process.cwd();
var currentworkingdirectory;
var temppath = os.tmpdir();
var testproject = "TestProject";

deleteFolderRecursive = function(path) {
    var files = [];
    if( fs.existsSync(path) ) {
        files = fs.readdirSync(path);
        files.forEach(function(file,index){
            var curPath = path + "/" + file;
            if(fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

suite('CreateSuite', function() {

	setup(function() {
		// Switch directory to a temp directory
		process.chdir(temppath);
	});

	test('Testing passing an unknown command', function() {
		var args = [];
		var projectpath = temppath + args[0];

		create(args, function(testing_code) {
			testing_code.should.equal(testing.createsuite.unknown);
		});
	});

	test('Create a project', function(done) {
		var args = [testproject];
		var projectpath = temppath + args[0];

		async.series([
			function(cb) {
				if(fs.existsSync(projectpath)) {
					deleteFolderRecursive(projectpath);
				}
				while(fs.existsSync(projectpath)) {

				}
				cb();
			},
			function(cb) {
				create(args, function(testing_code) {
					testing_code.should.equal(testing.createsuite.projectcreated);
					cb();
				});
			},
			function(cb) {
				fs.existsSync(os.tmpdir() + testproject + '/custom').should.be.true;
				fs.existsSync(os.tmpdir() + testproject + '/deploy').should.be.true;
				fs.existsSync(os.tmpdir() + testproject + '/index.html').should.be.true;
				fs.existsSync(os.tmpdir() + testproject + '/index.json').should.be.true;
				cb();
			}
		], function() {
			done();
		});
	});

	test('Create a project which already exists', function(done) {
		var args = [testproject];
		var projectpath = temppath + args[0];
		create(args, function(testing_code) {
			testing_code.should.equal(testing.createsuite.projectexists);
			done();
		});
	});

	test('Create a view in test project', function(done) {
		var testviewproject = testproject + '1';
		var args = [testviewproject];
		var projectpath = temppath + args[0];
		async.series([
			function(cb) {
				if(fs.existsSync(projectpath)) {
					deleteFolderRecursive(projectpath);
				}
				while(fs.existsSync(projectpath)) {

				}
				cb();
			},
			function(cb) {
				create(args, function(testing_code) {
					process.chdir(testviewproject);
					cb();
				});
			},
			function(cb) {
				var view_args = ["view", "newview"];
				create(view_args, function(testing_code) {
					testing_code.should.equal(testing.createsuite.viewcreated);
					cb();
				});
			},
			function(cb) {
				fs.existsSync(os.tmpdir() + testviewproject + '/newview.html').should.be.true;
				fs.existsSync(os.tmpdir() + testviewproject + '/newview.json').should.be.true;
				cb();
			}
		], function() {
			done();
		});
	});
});