'use strict'

var os = require('os');
var fs = require('fs');

var should = require('should');
var async = require('async');
var logger = require('jslogging');

var testing = require('../testing.json');
var server = require('../bin/server.js');

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

suite('ServerSuite', function() {

  setup(function() {
    // Switch directory to a temp directory
    process.chdir(temppath);
    server.setSettings(settings);
    logger.setLogLevel(-1);
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
        server.setRootDirectory('./');
        server.setHtmlFiles(["index.html"]);
        server.handleRequest(req, res, cb);
      }
    ], function(err, result) {
      result[0].should.equal(testing.nirodhaManager.notfound);
      done();
    });
  });

  test('Testing handleRequest with blank uri', function(done) {
    // Mock up reqeust and response objects
    var req = {};
    req.url = '/';

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
        server.setRootDirectory('./');
        server.setHtmlFiles(["index.html"]);
        server.handleRequest(req, res, cb);
      }
    ], function(err, result) {
      result[0].should.equal(testing.nirodhaManager.html);
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
        server.setRootDirectory(os.tmpdir() + '/' + testing.create.testproject + '/');
        server.setHtmlFiles(["index.html"]);
        server.handleRequest(req, res, cb);
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
        server.init(["index.html"], os.tmpdir() + '/' + testing.create.testproject + '/');
        server.setRootDirectory(os.tmpdir() + '/' + testing.create.testproject + '/');
        server.setHtmlFiles(["index.html"]);
        server.handleRequest(req, res, cb);
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
        server.setRootDirectory(os.tmpdir() + '/' + testing.create.testproject + '/');
        server.setHtmlFiles(["index.css"]);
        server.handleRequest(req, res, cb);
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
        server.setRootDirectory(os.tmpdir() + '/' + testing.create.testproject + '/');
        server.setHtmlFiles(["index.js"]);
        server.handleRequest(req, res, cb);
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
        server.setRootDirectory(os.tmpdir() + '/' + testing.create.testproject + '/');
        server.setHtmlFiles(["index.png"]);
        server.handleRequest(req, res, cb);
      }
    ], function(err, result) {
      result[0].should.equal(testing.nirodhaManager.notfound);
      done();
    });
  });

  test('server parse fail on bad submits', function(done) {
    try {
      server.parse();
    }
    catch (e) {
      e.should.not.equal(null);
      done();
    }
  });

  test('server handleRequest invalid htmlFiles', function(done) {
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
    server.setHtmlFiles(undefined);
    try {
      server.handleRequest(req, res, cb);
    }
    catch (e) {
      e.should.not.equal(null);
      done();
    }
  });

  test('server handleRequest with static file', function(done) {
    var res = {};
    var req = {};
    req.url = '/index.png';
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
    server.setRootDirectory(os.tmpdir() + '/' + testing.create.testproject + '/');
    server.setHtmlFiles(["index.html"]);
    fs.writeFileSync(os.tmpdir() + '/' + testing.create.testproject + '/custom/static/index.png', 'Nothing here!');
    var cb = function(err, result) {
      result.should.equal(testing.nirodhaManager.file);
      fs.unlinkSync(os.tmpdir() + '/' + testing.create.testproject + '/custom/static/index.png');
      done();
    }
    server.handleRequest(req, res, cb);
  });

});