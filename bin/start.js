var http = require('http');
var logging = require('./logging.js');
var fs = require('fs');
var path = require('path');
var settings = require('../settings.json');
var async = require('async');

var searchDirectories = [];

var NOT_FOUND = 'There is no view or library file which corresponds to the request';

// Method to get all files in directories
var walkSync = function (start, callback) {
  var stat = fs.statSync(start);

  if (stat.isDirectory()) {
    var filenames = fs.readdirSync(start);

    var coll = filenames.reduce(function (acc, name) {
      var abspath = path.join(start, name);

      if (fs.statSync(abspath).isDirectory()) {
        acc.dirs.push(name);
      } else {
        acc.names.push(name);
      }

      return acc;
    }, {"names": [], "dirs": []});

    callback(start, coll.dirs, coll.names);

    coll.dirs.forEach(function (d) {
      var abspath = path.join(start, d);
      walkSync(abspath, callback);
    });

  } else {
    throw new Error("path: " + start + " is not a directory");
  }
};

// Filters
var isHtmlFile = function(element) {
	return element.indexOf('.html') > 0;
}

var isJsFile = function(element) {
	return element.indexOf('.js' > 0);
}

var isCssFile = function(element) {
	return element.indexOf('.css' > 0);
}

module.exports = function (args) {
	// Set up search
	searchDirectories.push('./custom');
	searchDirectories.push(settings.path_to_nirodha + 'libs');

	var htmlFiles = fs.readdirSync('.').toString().split(',').filter(isHtmlFile);

	// Start by searching the custom directories
	async.series([
		function(callback) {
			var files = [];
			walkSync(searchDirectories[0], function(dir, directories, fileNames) {
				files.push({ "fileNames": fileNames, "dir": dir});
				//logging('Loading file ' + one + '/' + three, 7);
			});
			callback(null, files);
		},
		function(callback) {
			var files = [];
			walkSync(searchDirectories[1], function(dir, directories, fileNames) {
				files.push({ "fileNames": fileNames, "dir": dir});
				//logging('Loading file ' + one + '/' + three, 7);
			});
			callback(null, files);
		}
		],
		function (err, libraries) {

			logging('HTML Files loaded: ' + JSON.stringify(htmlFiles), 7);
			logging('Files in ' + searchDirectories[0] + ': ' + JSON.stringify(libraries[0]), 7);
			logging('Files in ' + searchDirectories[1] + ': ' + JSON.stringify(libraries[1]), 7);

			var jsFiles = "";

			var findJsFiles = function(resultFileList) {
				var returnableJsFiles = "";
				for(var i = 0; i < resultFileList.length; i++) {
					//logging('Result files list: ' + resultFileList[i], 7);
					if(resultFileList[i].fileNames.filter(isJsFile).length > 0) {
						logging('Js files are : ' + resultFileList[i].fileNames.filter(isJsFile), 7);
						returnableJsFiles += ',' + resultFileList[i].fileNames.filter(isJsFile).toString();
					}
				}
				return returnableJsFiles;
			}

			jsFiles = findJsFiles(libraries[0]);
			jsFiles += findJsFiles(libraries[1]);
			logging('JS files is : ' + jsFiles, 7);
			jsFiles = jsFiles.split(',');

			console.log('Found the following list of JS files in Nirodha paths: ' + JSON.stringify(jsFiles));

			logging('Creating server ...');
			http.createServer(function (req, res) {
				logging('req.url: ' + req.url, 7);
				if(req.url == '/favicon.ico') {
					res.writeHead(200, {'Content-Type': 'text/plain'});
					res.end('');
				}
				else if(req.url) {
					// Parse the request url
					var URI = req.url.substring(1, req.url.length);
					logging('Requested URI is: ' + URI, 7);
					logging('Index of html in uri: ' + (URI.indexOf('html') > 0), 7);
					if(URI.indexOf('html') > 0) {
						logging('HtmlFiles length: ' + htmlFiles.length);
						for(var i = 0; i < htmlFiles.length; i++) {
							logging('Comparing ' + htmlFiles[i] + ' to ' + URI);
							if(htmlFiles[i] === URI) {
								logging('A matching view for ' + req.url + ' has been found, reading and serving the page...');

								// Get a handle to a VM object
								var vm = require('./viewManager.js');
								vm.init(URI);

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
					// Look for a static library matching the request
					else if(URI.indexOf('js') > 0 || URI.indexOf('css') > 0) {
						// Get a handle to a LM object
						var lm = require('./libraryManager.js');

						lm.init(libraries);

						// Make sure to loop through all directories which could have js or css files
						logging('A matching library for ' + req.url + ' has been found, reading and serving the page...');
						logging('TODO: Implement serving logic');

						logging('Sending fake not found: ' + NOT_FOUND + ' ' + req.url);
						res.writeHead(404, {'Content-Type': 'text/plain'});
						res.end(NOT_FOUND + ' ' + req.url);
					}
					else {

						logging(NOT_FOUND + ' ' + req.url);
						res.writeHead(404, {'Content-Type': 'text/plain'});
						res.end(NOT_FOUND + ' ' + req.url);
					}
					// IF Look for a matching view
						// If a matching view exists, determine what is being requested
						// If its an html file, parse the thtml, and replace the includes with the appropriate stuff
						// Else it is a CSS or a JS file, check the custom folder for the appropriate file
							// If you can't find that, check the libraries for a matching asset
					// ELSE Send a generic 404 if no matching view exists

					// FINALLY Serve the matching asset in the response
				}
			}).listen(10080);
	});


	//var templateFiles = loadModules('thtml');


	// Export all of the libraries that can be loaded from both the Nirodha base folder
	// and the custom libraries inside of the Nirodha project



}