'use strict'

var os = require('os');
var fs = require('fs');

var should = require('should');
var async = require('async');
var logger = require('jslogging');

var testing = require('../testing.json');
var nm = require('../bin/nirodhaManager.js');

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

suite('NirodhaManagerSuite', function() {

  setup(function() {
    // Switch directory to a temp directory
    process.chdir(temppath);
    nm.setSettings(settings);
    logger.setLogLevel(-1);
  });

  test('Testing findJsFiles', function() {
    var rawFileList = testing.directoryList;
    var actual = nm.findJsFiles(rawFileList);
    actual.should.equal('test.js,test.js,');
  });

  test('Testing findCSSFiles', function() {
    var rawFileList = testing.directoryList;
    var actual = nm.findCSSFiles(rawFileList);
    actual.should.equal('test.css,test.css,');
  });

  test('Testing handleRequest with no url to find', function(done) {
    // Mock up reqeust and response objects
    var req = {};
    req.url = '/test/test';

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

    async.series([
      function(cb) {
        nm.setRootDirectory('./');
        nm.setHtmlFiles(["index.html"]);
        nm.handleRequest(req, res, cb);
      }
    ], function(err, result) {
      result[0].should.equal(testing.nirodhaManager.notfound);
      done();
    });
  });

  test('Testing handleRequest with html file', function(done) {
    // Mock up reqeust and response objects
    var req = {};
    req.url = '/index.html';

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

    async.series([
      function(cb) {
        nm.setRootDirectory(os.tmpdir() + '/' + testing.create.testproject + '/');
        nm.setHtmlFiles(["index.html"]);
        nm.handleRequest(req, res, cb);
      }
    ], function(err, result) {
      result[0].should.equal(testing.nirodhaManager.html);
      done();
    });
  });

  test('Testing handleRequest with html file and querystring', function(done) {
    // Mock up reqeust and response objects
    var req = {};
    req.url = '/index.html?q=test';

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

    async.series([
      function(cb) {
        nm.setRootDirectory(os.tmpdir() + '/' + testing.create.testproject + '/');
        nm.setHtmlFiles(["index.html"]);
        nm.handleRequest(req, res, cb);
      }
    ], function(err, result) {
      result[0].should.equal(testing.nirodhaManager.html);
      done();
    });
  });

  test('Testing handleRequest with css file', function(done) {
    // Change directory into the test project
    process.chdir(os.tmpdir() + '/' + testing.create.testproject + '/');

    // Mock up reqeust and response objects
    var req = {};
    req.url = '/index.css';

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

    async.series([
      function(cb) {
        nm.setRootDirectory(os.tmpdir() + '/' + testing.create.testproject + '/');
        nm.setHtmlFiles(["index.css"]);
        nm.handleRequest(req, res, cb);
      }
    ], function(err, result) {
      result[0].should.equal(testing.libraryManager.jscss);
      done();
    });
  });

  test('Testing handleRequest with js file', function(done) {
    // Change directory into the test project
    process.chdir(os.tmpdir() + '/' + testing.create.testproject + '/');

    // Mock up reqeust and response objects
    var req = {};
    req.url = '/index.js';

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

    async.series([
      function(cb) {
        nm.setRootDirectory(os.tmpdir() + '/' + testing.create.testproject + '/');
        nm.setHtmlFiles(["index.js"]);
        nm.handleRequest(req, res, cb);
      }
    ], function(err, result) {
      result[0].should.equal(testing.libraryManager.jscss);
      done();
    });
  });

  test('Testing handleRequest with static file', function(done) {
    // Mock up reqeust and response objects
    var req = {};
    req.url = '/index.png';

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

    logger.log('Current working directory: ' + process.cwd());
    async.series([
      function(cb) {
        nm.setRootDirectory(os.tmpdir() + '/' + testing.create.testproject + '/');
        nm.setHtmlFiles(["index.png"]);
        nm.handleRequest(req, res, cb);
      }
    ], function(err, result) {
      result[0].should.equal(testing.nirodhaManager.notfound);
      done();
    });
  });
});