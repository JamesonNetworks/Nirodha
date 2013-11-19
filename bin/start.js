var http = require('http');
var logging = require('./logging.js');
var fs = require('fs');
var settings = require('../settings.json');
var async = require('async');
//var index = fs.readFileSync('index.html');

var rootSearchDirectories = [];
var librarySearchDirectories = [];

var NOT_FOUND = 'There is no view or library file which corresponds to the request';

// Walk a directory structure for all files inside of the structure
var walk = function(dir, done) {
	var results = [];
	fs.readdir(dir, function(err, list) {
		if (err) return done(err);
		var i = 0;
		(function next() {
			var file = list[i++];
			if (!file) return done(null, results);
			file = dir + '/' + file;
			fs.stat(file, function(err, stat) {
				if (stat && stat.isDirectory()) {
					walk(file, function(err, res) {
            		results = results.concat(res);
            		next();
          		});
        	} 
        	else {
          		results.push(file);
          		next();
        	}});
    	})();
	});
};

var loadModules = function(moduleExtension, loadModuleCallback) {
	logging('Entering load modules...', 7);

	var searchOptions = {};
	searchOptions.directoryIsRoot = true;
	searchOptions.directories = [];

	switch(moduleExtension) {
		case 'html':
			searchOptions.directories = rootSearchDirectories;
			logging('Search Options based on extension:' + JSON.stringify(searchOptions), 7);
		break;
		default:
			searchOptions.directories = librarySearchDirectories;
			searchOptions.directoryIsRoot = false;
			logging('Search Options based on extension:' + JSON.stringify(searchOptions), 7);
		break;
	}

	var files;
	var libraryFiles = [];

	async.series([
		function(callback) {
			// Export all of the possible routes based on the views present in the Nirodha project
			// Get a list of all the thtml files in the root of the project
			if(searchOptions.directoryIsRoot) {
				files = fs.readdirSync(searchOptions.directories[0]).toString().split(',');
				logging('Files from fs.readdirSync: ' + files, 7);
				callback(null, files);
			}
			else {
				var tempcb = function(err, result) {
					libraryFiles.push(result);
				}
				for(var directory in searchOptions.directories) {
					walk(directory, tempcb);
				}
				callback(null, libraryFiles);
			}
		},
		function(callback) {
			var fileListResult = [];
			if(searchOptions.directoryIsRoot) {
				for(var i = 0; i < files.length; i++) {
					logging('Checking ' + files[i] + ' for proper extension (' + moduleExtension + '), Add it?: ' + (files[i].split('.')[files[i].split('.').length-1] === moduleExtension));
					if(files[i].split('.')[files[i].split('.').length-1] === moduleExtension) {
						// Add the files to the list of files
						fileListResult.push(files[i].substring(0, files[i].length - moduleExtension.length) + moduleExtension);
					}
				}
				console.log('The following files with type ' + moduleExtension + ' have been loaded:');
				for(var i = 0; i < fileListResult.length; i++) {
					console.log(fileListResult[i]);
				}
			}
			else {
				for(var k=0; k < libraryFiles.length; k++) {
					for(var i = 0; i < libraryFiles[k][i].length; i++) {
						if(files[i].split('.')[libraryFiles[k][i].split('.').length-1] === moduleExtension) {
							// Add the files to the list of files
							fileListResult.push(libraryFiles[k][i].substring(0, files[i].length - moduleExtension.length) + moduleExtension);
						}
					}
				}
				console.log('The following files with type ' + moduleExtension + ' have been loaded:');
				if(fileListResult.length == 0) {
					console.log('No files with ' + moduleExtension + ' extension have been found...');
				}
				else {
					for(var i = 0; i < fileListResult.length; i++) {
						console.log(fileListResult[i]);
					}
				}
			}

			callback(null, fileListResult)
		}
		], loadModuleCallback);
}

module.exports = function (args) {
	// Set up search
	rootSearchDirectories.push('.');
	librarySearchDirectories.push('./libs');
	librarySearchDirectories.push(settings.path_to_nirodha + 'libs');

	logging('Entering module loading...', 7);
	async.series([
		function(cb) {
			logging('Entering html file loader', 7);
			logging('File loader callback: ' + cb, 7);
			loadModules('html',cb);
		},
		function(cb) {
			loadModules('js', cb);
		},
		function(cb) {
			loadModules('css', cb);
		}
		], function(err, results) {
			if(err) {
				logging(err, 3);
			}
			logging('The results from loading: ' + JSON.stringify(results), 7);
			var htmlFiles = results[0][1]; 
			var jsFiles = results[1][1];
			var cssFiles = results[2][1];

			logging('htmlFiles: ' + htmlFiles, 7);
			logging('jsFiles: ' + jsFiles, 7);
			logging('cssFiles: ' + cssFiles, 7);

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

					if(htmlFiles.indexOf(URI) != -1) {
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
					// Look for a static library matching the request
					else if(false) {
						// Make sure to loop through all directories which could have js or css files

						logging('A matching library for ' + req.url + ' has been found, reading and serving the page...');

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
	})


	//var templateFiles = loadModules('thtml');


	// Export all of the libraries that can be loaded from both the Nirodha base folder
	// and the custom libraries inside of the Nirodha project



}