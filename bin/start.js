var http = require('http');
var logger = require('./logging.js');
var fs = require('fs');
var path = require('path');
var settings = require('../settings.json');
var async = require('async');
var constants = require('./constants.js');
var url = require('url');
var utils = require('./utilities.js');
var settings = require('../settings.json');

// Handle to library manager
var lm = require('./libraryManager.js');

var LIBRARY_NOT_FOUND = 'There is no view or library file which corresponds to the request';
var mimeTypes = {
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "js": "text/javascript",
    "css": "text/css",
    "gif": "image/gif",
    "ico": "image/gif",
    "svg": "image/svg+xml"
};

var searchDirectories = [];

// Method to get all files in directories
var walkSync = utils.walkSync;

// Filters
var isHtmlFile = utils.isHtmlFile;

var isJsFile = utils.isJsFile;

var isCssFile = utils.isCssFile;

var rootDirectory;

module.exports = function (args) {
	if(args.length > 0) {
		rootDirectory = args[0];
	}
	else {
		rootDirectory = '.';
	}

	// Set up search
	searchDirectories.push(rootDirectory + '/custom');
	searchDirectories.push(settings.path_to_nirodha + 'libs');

	var htmlFiles = fs.readdirSync(rootDirectory).toString().split(',').filter(isHtmlFile);

	// Start by searching the custom directories
	async.series([
		function(callback) {
			var files = [];
			walkSync(searchDirectories[0], function(dir, directories, fileNames) {
				files.push({ "fileNames": fileNames, "dir": dir});
				//logger.log('Loading file ' + one + '/' + three, 7);
			});
			callback(null, files);
		},
		function(callback) {
			var files = [];
			walkSync(searchDirectories[1], function(dir, directories, fileNames) {
				files.push({ "fileNames": fileNames, "dir": dir});
				//logger.log('Loading file ' + one + '/' + three, 7);
			});
			callback(null, files);
		}
		],
		function (err, libraries) {

			logger.log('HTML Files loaded: ' + JSON.stringify(htmlFiles), 7);
			//logger.log('Files in ' + searchDirectories[0] + ': ' + JSON.stringify(libraries[0]), 7);
			//logger.log('Files in ' + searchDirectories[1] + ': ' + JSON.stringify(libraries[1]), 7);

			var jsFiles = "";
			var cssFiles = "";

			var findJsFiles = function(resultFileList) {
				var returnableJsFiles = "";
				//logger.log('in findJsFiles: Result files list: ' + resultFileList[i], 7);
				for(var i = 0; i < resultFileList.length; i++) {
					//logger.log('in findJsFiles: Result files list: ' + JSON.stringify(resultFileList[i].fileNames), 7);
					//logger.log('in findJsFiles: Result files list: ' + JSON.stringify(resultFileList[i].fileNames.filter(isJsFile)), 7);
					if(resultFileList[i].fileNames.filter(isJsFile).length > 0) {
						//logger.log('Js files are : ' + resultFileList[i].fileNames.filter(isJsFile), 7);
						returnableJsFiles += resultFileList[i].fileNames.filter(isJsFile).toString() + ',';
					}
				}
				return returnableJsFiles;
			};

			var findCSSFiles = function(resultFileList) {
				var returnableJsFiles = "";
				//logger.log('in findJsFiles: Result files list: ' + resultFileList[i], 7);
				for(var i = 0; i < resultFileList.length; i++) {
					//logger.log('in findJsFiles: Result files list: ' + JSON.stringify(resultFileList[i].fileNames), 7);
					//logger.log('in findJsFiles: Result files list: ' + JSON.stringify(resultFileList[i].fileNames.filter(isJsFile)), 7);
					if(resultFileList[i].fileNames.filter(isCssFile).length > 0) {
						//logger.log('Js files are : ' + resultFileList[i].fileNames.filter(isJsFile), 7);
						returnableJsFiles += resultFileList[i].fileNames.filter(isCssFile).toString() + ',';
					}
				}
				return returnableJsFiles;
			};

			jsFiles = findJsFiles(libraries[0]);
			jsFiles += ',' + findJsFiles(libraries[1]);
			logger.log('JS files is : ' + jsFiles, 7);
			jsFiles = jsFiles.split(',');

			cssFiles = findCSSFiles(libraries[0]);
			cssFiles += ',' + findCSSFiles(libraries[1]);
			logger.log('CSS files is : ' + cssFiles, 7);
			cssFiles = cssFiles.split(',');

			logger.log('Found the following HTML files: ' + JSON.stringify(htmlFiles), 5);
			logger.log('Found the following list of JS files in Nirodha paths: ' + JSON.stringify(jsFiles), 5);
			logger.log('Found the following list of CSS files in Nirodha paths: ' + JSON.stringify(cssFiles), 5);

			logger.log('Library manager init...');
			lm.init(libraries, jsFiles, cssFiles);

			logger.log('Creating server ...');

			var server = http.createServer(function (req, res) {
				logger.log('req.url: ' + req.url, 7);
				// 
				if(req.url) {
					// Parse the request url
					var URI = req.url.substring(1, req.url.length);
					logger.log('Requested URI is: ' + URI, 7);
					logger.log('Index of html in uri: ' + (URI.indexOf('html') > 0), 7);
					if(URI.indexOf('html') > 0) {
						// Look for the file in the html file list
						logger.log('HtmlFiles length: ' + htmlFiles.length);
						for(var i = 0; i < htmlFiles.length; i++) {
							logger.log('Comparing ' + htmlFiles[i] + ' to ' + URI);
							if(htmlFiles[i] === URI) {
								logger.log('A matching view for ' + req.url + ' has been found, reading and serving the page...');

								// Get a handle to a VM object
								var vm = require('./viewManager.js');
								logger.log('Serving ' + rootDirectory + ' as root directory and ' + URI + ' as view');
								vm.init(rootDirectory, URI);

								// Set the headers to NEVER cache results
								res.writeHead(200, {
									'Content-Type': 'text/html',
									'cache-control':'no-cache'
								});
								// Call into the ViewManager and parse the pages
								vm.parse(res);
							}

						}
					}
					// Look for a library matching the request
					else if(URI.indexOf('.js') > 0 || URI.indexOf('.css') > 0) {

						logger.log('Handing ' + req.url + ' to the library manager...');
						lm.serveLibrary(URI, res);
					}
					else if(URI === '') {
						logger.log('There was no request URI, serving links to each view...', 7);
						var pageText = '';
						for(var i = 0; i < htmlFiles.length; i++) {
							pageText += '<a href='+ htmlFiles[i] + '> ' + htmlFiles[i] + '</a> \n';
						}
						// Set the headers to NEVER cache results
						res.writeHead(200, {
							'Content-Type': 'text/html',
							'cache-control':'no-cache'
						});
						res.write(pageText);
						res.end();
					}
					// Look for a static file in the static files directory
					else {
						var uri = url.parse(req.url).pathname;
						var filename = path.join(rootDirectory + '/custom/static/', unescape(uri));
						var stats;

						logger.log('Attempting to serve a static asset matching ' + uri);
						logger.log('Using ' + filename + ' as filename...', 7);
						try {
							stats = fs.lstatSync(filename); // throws if path doesn't exist
						} 
						catch (e) {
							filename = path.join(rootDirectory + '/static/', unescape(uri));
							logger.log('No matching asset found in project custom directory for ' + uri + '...', 4);
							logger.log('Attempting to serve a static asset matching from libs ' + uri);
							logger.log('Using ' + filename + ' as filename...', 7);

							try {
								stats = fs.lstatSync(filename); // throws if path doesn't exist
							} 
							catch (e) {
								logger.log('No static asset was found for ' + filename + '...', 4);
								res.writeHead(404, {'Content-Type': 'text/plain'});
								res.write('404 Not Found\n');
								res.end();
								return;
							}

						}


						if (stats.isFile()) {
							// path exists, is a file
							logger.log('constants: ' + JSON.stringify(constants), 7);
							logger.log('extension: ' + path.extname(filename).split(".")[1], 7);

							var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
							logger.log('mimeType: ' + mimeType, 7);
							res.writeHead(200, {'Content-Type': mimeType} );

							var fileStream = fs.createReadStream(filename);
							fileStream.pipe(res);
						} 
						else if (stats.isDirectory()) {
							// path exists, is a directory
							res.writeHead(200, {'Content-Type': 'text/plain'});
							res.write('Requested directory, '+uri+'\n');
							res.end();
						} 
						else {
							// Symbolic link, other?
							// TODO: follow symlinks?  security?
							res.writeHead(500, {'Content-Type': 'text/plain'});
							res.write('500 Internal server error\n');
							res.end();
						}
					}
				}
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


	//var templateFiles = loadModules('thtml');


	// Export all of the libraries that can be loaded from both the Nirodha base folder
	// and the custom libraries inside of the Nirodha project



};
