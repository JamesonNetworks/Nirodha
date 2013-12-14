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

LibraryManager.prototype.getLibraryContents = function(uri, callback) {
	var found = false;
	var type;
	logging('Entering serveLibrary...', 7);
	if(found) {
		for(var i = 0; i < Libraries.length; i++) {
			for(var k = 0; k < Libraries[i].length; k++) {
				if(Libraries[i][k].fileNames.indexOf(uri) > -1) {
					var path  = Libraries[i][k].dir + '/' + uri;
					var pageText = fs.readFileSync(path).toString();
					logging('Writing file from path: ' + path);
					callback(pageText, true);

				}
			}
		}
	}
	else {
		callback(null, false);
	}
}

LibraryManager.prototype.getLibraryContentsAsString = function(uri) {
	return LibraryManager.prototype.getLibraryContents(uri, function(pageText, found) {
		if(found) {
			return pageText;
		}
		else {
			return '';
		}
	});
}

// Accepts a response object and parses a view into it
LibraryManager.prototype.serveLibrary = function(uri, res) {
	LibraryManager.prototype.getLibraryContents(uri, function(pageText, found) {
		if(found) {
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
		else {
			res.writeHead(404, {'Content-Type': 'text/plain'});
			res.end(constants.LIBRARY_NOT_FOUND + ' ' + uri);
		}
	});
}