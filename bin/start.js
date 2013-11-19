var http = require('http');
var logging = require('./logging.js');
var fs = require('fs');
var settings = require('../settings.json');
//var index = fs.readFileSync('index.html');

var rootSearchDirectories = ['.'];
var librarySearchDirectories = ['./libs', settings.path_to_nirodha + '/libs', ];

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

var loadModules = function(moduleExtension) {
	var fileListResult = [];

	// Export all of the possible routes based on the views present in the Nirodha project
	// Get a list of all the thtml files in the root of the project
	var files = fs.readdirSync('.').toString().split(',');

	//Replace call to files list with:
	// walk(process.env.HOME, function(err, results) {
	// 	if (err) throw err;
	// 	console.log(results);
	// });

	for(var i = 0; i < files.length; i++) {
		if(files[i].split('.')[files[i].split('.').length-1] === moduleExtension) {
			// Add the files to the list of files
			fileListResult.push(files[i].substring(0, files[i].length - moduleExtension.length) + moduleExtension);
		}
	}
	console.log('The following files with type ' + moduleExtension + ' have been loaded:');
	for(var i = 0; i < fileListResult.length; i++) {
		console.log(fileListResult[i]);
	}

	return fileListResult;
}

module.exports = function (args) {
	// Populate the file lists
	var thtmlFiles = loadModules('html');
	var jsFiles = loadModules('js');
	var cssFiles = loadModules('css');
	//var templateFiles = loadModules('thtml');


	// Export all of the libraries that can be loaded from both the Nirodha base folder
	// and the custom libraries inside of the Nirodha project


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

			if(thtmlFiles.indexOf(URI) != -1) {
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
}