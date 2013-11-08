var http = require('http');
var logging = require('./logging.js');
var fs = require('fs');
//var index = fs.readFileSync('index.html');

module.exports = function (args) {

	// Export all of the possible routes based on the views present in the Nirodha project
	// Get a list of all the thtml files in the root of the project
	var files = fs.readdirSync('.').toString().split(',');
	var thtmlFiles = [];

	for(var i = 0; i < files.length; i++) {
		if(files[i].split('.')[files[i].split('.').length-1] === 'thtml') {
			// Add the files to the list of files
			thtmlFiles.push(files[i].substring(0, files[i].length - 6) + '.html');
		}
	}
	console.log('The following routes have corresponding views:');
	for(var i = 0; i < thtmlFiles.length; i++) {
		console.log(thtmlFiles[i]);
	}


	http.createServer(function (req, res) {
		// Handle favicon request
		if(req.url == '/favicon.ico') {
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.end('');
		}
		else if(req.url) {
			// Parse the request url
			var view = req.url.substring(1, req.url.length);
			if(thtmlFiles.indexOf(view) != -1) {
				logging('A matching view for ' + req.url + ' has been found, reading and serving the page...');

				// Get a handle to a VM object
				var vm = require('./viewManager.js');
				vm.init(view);

				// Set the headers to NEVER cache results
				res.writeHead(200, {
					'Content-Type': 'text/html',
					'cache-control':'no-cache'
				});
				res.end(vm.parse());
			}
			// Look for a static library matching the request
			else if(false) {
				logging('A matching library for ' + req.url + ' has been found, reading and serving the page...');

			}
			else {
				var NOT_FOUND = 'There is no view which corresponds to the request';
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
	}).listen(8080);
}