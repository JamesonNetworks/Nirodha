'use strict'

var os = require('os');
var fs = require('fs');

var should = require('should');
var async = require('async');
var logger = require('jslogging');

var testing = require('../testing.json');
var lm = require('../bin/libraryManager.js');

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

suite('LibraryManagerSuite', function() {

  setup(function() {
    // Switch directory to a temp directory
    process.chdir(temppath + '/' + testproject);
    logger.setLogLevel(-1);
  });

  test('Testing serveLibrary', function(done) {
    var res = {};
    res.writeHead = function(string) {
      this.head = string;
    };
    res.write = function(string) {
      this.write = string;
    };
    res.end = function() {

    };
    res.send = function(string) {
      this.send = string;
    };
    var callback = function(err, result) {
      result.should.equal(testing.libraryManager.jscss); 
      done();     
    }
    lm.serveLibrary('index.js', res, callback);
  });

  test('Testing serveLibrary - no library actually there', function(done) {
    var res = {};
    res.writeHead = function(string) {
      this.head = string;
    };
    res.write = function(string) {
      this.write = string;
    };
    res.end = function() {

    };
    res.send = function(string) {
      this.send = string;
    };
    var callback = function(err, result) {
      result.should.equal(testing.libraryManager.notfound); 
      done();     
    }
    lm.serveLibrary('not-a-thing-library-thing.js', res, callback);
  });
});