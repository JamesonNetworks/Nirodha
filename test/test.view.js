var os = require('os');
var fs = require('fs');

var should = require('should');
var async = require('async');
var logger = require('jslogging');

var testing = require('../testing.json');
var view = require('../bin/view.js');

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

var SERVED_HTML = '<script type=\"text/javascript\" src=\"index.js\"></script>\n<link rel=\"stylesheet\" href=\"index.css\">\n<script type=\"text/javascript\" src=\"index.js\"></script>\n<link rel=\"stylesheet\" href=\"index.css\">\n<!DOCTYPE html>\n<html>\n<head>\n\n{pre-load}\n</head>\n<body>\n\n<h1>My First Heading</h1>\n\n<p>My first paragraph.</p>\n\n</body>\n{templates}\n{post-load}\n\n</html>';

suite('View', function() {

    setup(function() {
        // Switch directory to a temp directory
        process.chdir(temppath + "TestProject");
        logger.setLogLevel(-1);
        view.init('index');
    });

    test('Testing view.getIncludes', function(done) {
        var includes = view.generateIncludesAsHTMLInserts();
        includes[0].js.should.equal('<script type=\"text/javascript\" src=\"index.js\"></script>\n');
        includes[1].css.should.equal('<link rel=\"stylesheet\" href=\"index.css\">\n');
        done();
    });

    test('Testing view.generateHTMLForServing', function(done) {
        var text = view.generateHTMLForServing();
        text.should.equal(SERVED_HTML);
        done();
    });

    test('Testing view.getLibraries', function(done) {
        var includes = view.getIncludes();
        logger.info(JSON.stringify(includes[1]));
        view.getLibraries(process.cwd(), 'js', includes[1], function(err, result) {
            logger.info(JSON.stringify(result));
            result.should.equal('// Your custom javascript for this view goes in this file\n\n');
            done();
        });
    });
});