var http = require('http');
var logger = require('jslogging');
var fs = require('fs');
var path = require('path');
var settings = require('../settings.json');
var async = require('async');
var constants = require('./constants.js');
var url = require('url');
var utils = require('./utilities.js');

// Handle to library manager
var lm = require('./libraryManager.js');

var searchDirectories = [];

// Method to get all files in directories
var walkSync = utils.walkSync;

// Filters
var isHtmlFile = utils.isHtmlFile;
var isJsFile = utils.isJsFile;
var isCssFile = utils.isCssFile;

var rootDirectory;

module.exports = function (args, settings) {
	var nm = require('./nirodhaManager.js');
	nm.setSettings(settings);

	var rootDirectory;
	if(args.length > 0) {
		rootDirectory = args[0];
	}
	else {
		rootDirectory = './';
	}

	searchDirectories = utils.getSearchDirectories(utils.getNirodhaPath());

	var htmlFiles = fs.readdirSync(rootDirectory).toString().split(',').filter(isHtmlFile);

	// Start by searching the custom directories
	async.series(utils.deriveLibraries(searchDirectories),
		function (err, libraries) {
			debugger;
			logger.debug(JSON.stringify(libraries));
			if(utils.hasDuplicateLibraries(libraries)) {
				logger.warn('Duplicate libraries found. This occurs when two js or css libraries have conflicting names. Resolve the conflict in your libraries before continuing.');
			}
			logger.debug('HTML Files loaded: ' + JSON.stringify(htmlFiles));
			//logger.log('Files in ' + searchDirectories[0] + ': ' + JSON.stringify(libraries[0]), 7);
			//logger.log('Files in ' + searchDirectories[1] + ': ' + JSON.stringify(libraries[1]), 7);

			var jsFiles = "";
			var cssFiles = "";

			jsFiles = utils.findJsFiles(libraries[0]);
			jsFiles += ',' + utils.findJsFiles(libraries[1]);
			logger.debug('JS files is : ' + jsFiles);
			jsFiles = jsFiles.split(',');

			cssFiles = utils.findCSSFiles(libraries[0]);
			cssFiles += ',' + utils.findCSSFiles(libraries[1]);
			logger.debug('CSS files is : ' + cssFiles);
			cssFiles = cssFiles.split(',');

			logger.debug('Found the following HTML files: ' + JSON.stringify(htmlFiles));
			logger.debug('Found the following list of JS files in Nirodha paths: ' + JSON.stringify(jsFiles));
			logger.debug('Found the following list of CSS files in Nirodha paths: ' + JSON.stringify(cssFiles));

			logger.debug('Library manager init...');
			lm.init(libraries, jsFiles, cssFiles);

			logger.info('Creating server ...');
			nm.setRootDirectory(rootDirectory);
			nm.setHtmlFiles(htmlFiles);

			var server = http.createServer(function(req, res) {
				nm.handleRequest(req, res);
			}).listen(settings.port);

			server.on('error', function (err) {
				logger.log('An error occured, ' + err, 1);
				if (err.code == 'EADDRINUSE') {
					logger.log('The address is currently in use', 1);
				}
				else if(err.code == 'EACCES') {
					logger.log('You do not have access to use the specified port, ' + err, 1);
				}
			});
	});
};
