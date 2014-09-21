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


});