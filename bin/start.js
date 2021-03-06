var http = require('http');
var logger = require('jslogging');
var fs = require('fs');
var async = require('async');
var utils = require('./utilities.js');
var server = require('./server.js');

// Handle to library manager
var lm = require('./libraryManager.js');

var searchDirectories = [];

// Filters
var isHtmlFile = utils.isHtmlFile;

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
			server.setRootDirectory(rootDirectory);
			server.setHtmlFiles(htmlFiles);

			var http_server = http.createServer(function(req, res) {
				server.handleRequest(req, res);
			}).listen(settings.port);

			http_server.on('error', function (err) {
				logger.log('An error occured, ' + err, 1);
				if (err.code === 'EADDRINUSE') {
					logger.log('The address is currently in use', 1);
				}
				else if(err.code === 'EACCES') {
					logger.log('You do not have access to use the specified port, ' + err, 1);
				}
			});
	});
};
