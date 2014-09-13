var os = require('os');
var fs = require('fs');

var should = require('should');
var async = require('async');
var logger = require('jslogging');

var testing = require('../testing.json');
var util = require('../bin/utilities.js');

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
var temppath = os.tmpdir();
var testproject = "TestProject";

suite('UtilitySuite', function() {

  setup(function() {
    // Switch directory to a temp directory
    process.chdir(temppath);
  });

  test('Testing isHtmlFile filter', function() {
    var directoryList = testing.directoryList[0];
    var resultingDirectoryList = ['test.html'];
    directoryList.fileNames.toString().split(',').filter(util.isHtmlFile)[0].should.equal(resultingDirectoryList[0]);
  });

  test('Testing isJsFile filter', function() {
    var directoryList = testing.directoryList[0];
    var resultingDirectoryList = ['test.js'];
    directoryList.fileNames.toString().split(',').filter(util.isJsFile)[0].should.equal(resultingDirectoryList[0]);
  });

  test('Testing isCssFile filter', function() {
    var directoryList = testing.directoryList[0];
    var resultingDirectoryList = ['test.css'];
    directoryList.fileNames.toString().split(',').filter(util.isCssFile)[0].should.equal(resultingDirectoryList[0]);
  });

  test('Testing getSearchDirectories', function() {
    var expectedDirectories = ['./custom', settings.path_to_nirodha + 'libs', 'custom/static', 'bower_components'];
    var searchDirectories = util.getSearchDirectories(settings.path_to_nirodha);
    searchDirectories[0].should.equal(expectedDirectories[0]);
    searchDirectories[1].should.equal(expectedDirectories[1]);
    searchDirectories[2].should.equal(expectedDirectories[2]);
  });

  test('Testing deriveLibraries', function() {
    var searchDirectories = util.getSearchDirectories(settings.path_to_nirodha);
    searchDirectories[1] = './custom';
    var resultingLibraries = 
      [ 
        [ 
          { fileNames: [], dir: './custom' },
          { fileNames: [ 'index.css', 'newview.css' ], dir: 'custom/css' },
          { fileNames: [ 'index.js', 'newview.js' ], dir: 'custom/js' },
          { fileNames: [], dir: 'custom/static' },
          { fileNames: [ 'index_templates.html', 'newview_templates.html' ], dir: 'custom/templates' } 
        ],
        [ 
          { fileNames: [], dir: './custom' },
          { fileNames: [ 'index.css', 'newview.css' ], dir: 'custom/css' },
          { fileNames: [ 'index.js', 'newview.js' ], dir: 'custom/js' },
          { fileNames: [], dir: 'custom/static' },
          { fileNames: [ 'index_templates.html', 'newview_templates.html' ], dir: 'custom/templates' } 
        ] 
      ];
    process.chdir(temppath + '/TestProject/');
    async.series(util.deriveLibraries(searchDirectories),
      function (err, libraries) {
        if(err) {
          throw err;
        }
        JSON.stringify(resultingLibraries).should.equal(JSON.stringify(libraries));
      }
    );
  });

  test('Testing deriveLibraries: create error on multiple libraries with same name', function() {
    var searchDirectories = util.getSearchDirectories(settings.path_to_nirodha);
    searchDirectories[1] = './custom';
    var resultingLibraries = 
      [ 
        [ 
          { fileNames: [], dir: './custom' },
          { fileNames: [ 'index.css', 'index.js', 'newview.css' ], dir: 'custom/css' },
          { fileNames: [ 'index.js', 'newview.js' ], dir: 'custom/js' },
          { fileNames: [], dir: 'custom/static' },
          { fileNames: [ 'index_templates.html', 'newview_templates.html' ], dir: 'custom/templates' } 
        ],
        [ 
          { fileNames: [], dir: './custom' },
          { fileNames: [ 'index.css', 'index.js', 'newview.css' ], dir: 'custom/css' },
          { fileNames: [ 'index.js', 'newview.js' ], dir: 'custom/js' },
          { fileNames: [], dir: 'custom/static' },
          { fileNames: [ 'index_templates.html', 'newview_templates.html' ], dir: 'custom/templates' } 
        ] 
      ];
    process.chdir(temppath + '/TestProject/');
    // Copy the file, and make a second index.js in a different directory to cause bad state
    fs.createReadStream('./custom/js/index.js').pipe(fs.createWriteStream('./custom/css/index.js'));
    async.series(util.deriveLibraries(searchDirectories),
      function (err, libraries) {
         util.hasDuplicateLibraries(libraries).should.equal(false);
      }
    );
  });
});