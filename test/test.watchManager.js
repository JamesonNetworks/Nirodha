// 'use strict'

// var os = require('os');
// var fs = require('fs');

// var should = require('should');
// var async = require('async');
// var logger = require('jslogging');

// var testing = require('../testing.json');
// var wm = require('../bin/watchManager.js');

// try {
//   var settings = require('../settings.json');
// }
// catch(err) {
//   logger.warn('No settings file found, using default settings...');
//   var settings = require('../settings_template.json');
// }

// // Set up test variables
// var savedworkingdirectory = process.cwd();
// var currentworkingdirectory;
// var temppath = os.tmpdir() + '/';
// var testproject = "TestProject";

// suite('WatchManagerSuite', function() {

//   setup(function() {
//     // Switch directory to a temp directory
//     process.chdir(temppath + '/' + testproject);
//     logger.setLogLevel(-1);
//   });

//   test('Testing projectFileChangeEventHandler for one file', function(done) {
//     wm.projectFileChangeEventHandler('index.html', function(result) {
//       result.should.equal(testing.nirodhaManager.viewdeployed);
//       done();
//     });
//   });

//   test('Testing projectFileChangeEventHandler for two files very quickly', function(done) {
//     wm.projectFileChangeEventHandler('index.html');
//     wm.projectFileChangeEventHandler('index.html', function(result) {
//       result.should.equal(testing.nirodhaManager.viewdeployed);
//       done();
//     });
//   });

//   test('Testing projectFileChangeEventHandler with invalid filename', function(done) {
//     wm.projectFileChangeEventHandler('index', function(result) {
//       result.should.equal(testing.nirodhaManager.viewdeployed);
//       done();
//     });
//   });
// });