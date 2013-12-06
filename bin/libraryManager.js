var fs = require('fs');
var logging = require('./logging.js');
var async = require('async');
var constants = require('./constants.js');

var LIBRARY_NOT_FOUND = 'There is no view or library file which corresponds to the request';
var mimeTypes = {
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "js": "text/javascript",
    "css": "text/css"
}

var Libraries;
var JSFiles;
var CSSFiles;

/**
 * Expose the root.
 */

exports = module.exports = new LibraryManager;

/**
 * Expose `LibraryManager`.
 */

exports.LibraryManager = LibraryManager;

function LibraryManager() {

}

var notFound = function(res) {

}

// Accepts a response object and parses a view into it
LibraryManager.prototype.init = function(libraries, jsfiles, cssfiles) {
	Libraries = libraries;
	JSFiles = jsfiles == null ? [] : jsfiles;
	CSSFiles = cssfiles == null ? [] : cssfiles;
	logging('Libraries contained in current lm: ' + JSON.stringify(Libraries), 7);
}

// Accepts a response object and parses a view into it
LibraryManager.prototype.serveLibrary = function(uri, res) {
	var found = false;
	var type;
	logging('Entering serveLibrary...', 7);
	async.series([
			function(cb) {
				logging('Checking for library in the list of JSFiles and CSSFiles...', 7);
				logging('URI is ' + JSON.stringify(uri), 7);
				logging('JSFiles is ' + JSON.stringify(JSFiles), 7);
				logging('uri in JSfiles? ' + (JSFiles.indexOf(uri) > -1), 7 );
				logging('CSSFiles is ' + JSON.stringify(CSSFiles), 7);
				logging('uri in CSSFiles? ' + (CSSFiles.indexOf(uri) > -1), 7 );
				// Looking in JS files
				if(JSFiles.indexOf(uri) > -1) {
					found = true;
					logging('Found ' + uri + ' in the loaded javascript libraries...', 7);
					type = 'js';
					cb(null, null);
				}
				// Not a js file, looking in CSS files
				else if(CSSFiles.indexOf(uri) > -1) {
					found = true;
					type = 'css';
					logging('Found ' + uri + ' in the loaded CSS libraries...', 7);
					cb(null, null);
				}
				// Not found at all
				else {
					logging('No matching library for ' + uri + ' was found...');
					cb(null, null);
				}
			},
			function(cb) {
				// do nothing for now
				cb(null, null);
			}
		], 
		function(err, results) {
			if(found) {
				for(var i = 0; i < Libraries.length; i++) {
					for(var k = 0; k < Libraries[i].length; k++) {
						if(Libraries[i][k].fileNames.indexOf(uri) > -1) {
							var path  = Libraries[i][k].dir + '/' + uri;
							var pageText = fs.readFileSync(path).toString();
							logging('Writing file from path: ' + path);
							if(type === 'js') {
								res.writeHead(200, {
									'Content-Type': 'application/javascript',
									'cache-control':'no-cache'
								});
								res.end(pageText);
							}
							else if(type === 'css') {
								res.writeHead(200, {
									'Content-Type': 'text/css',
									'cache-control':'no-cache'
								});
								res.end(pageText);
							}
							else {
								res.writeHead(500, {'Content-Type': 'text/plain'});
								res.end('Internal server error');
							}
						}
					}
				}
			}
			else {
				res.writeHead(404, {'Content-Type': 'text/plain'});
				res.end(constants.LIBRARY_NOT_FOUND + ' ' + uri);
			}
		});
}