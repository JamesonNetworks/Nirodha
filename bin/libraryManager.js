var fs = require('fs');
var logger = require('jslogging');
var async = require('async');
var testing = require('../testing.json');

var constants = require('./constants.js');

var LIBRARY_NOT_FOUND = 'There is no view or library file which corresponds to the request';
var mimeTypes = {
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "js": "text/javascript",
    "css": "text/css"
};

var Libraries;
var JSFiles;
var CSSFiles;

/**
 * Expose the root.
 */

exports = module.exports = new LibraryManager();

/**
 * Expose `LibraryManager`.
 */

exports.LibraryManager = LibraryManager;

function LibraryManager() {

}

LibraryManager.prototype.init = function(libraries, jsfiles, cssfiles) {
	Libraries = libraries;
	JSFiles = jsfiles === null ? [] : jsfiles;
	CSSFiles = cssfiles === null ? [] : cssfiles;
	logger.debug('Libraries contained in current lm: ' + JSON.stringify(Libraries));
};

var getLibraryContents = function(uri, callback) {
	var found = false;
	var type;
	logger.debug('Entering getLibraryContents...');
	logger.debug(JSON.stringify(Libraries));
	if(typeof(Libraries) === 'undefined') {
		throw Error('No libraries defined, did you call LibraryManager.init first?');
	}
	for(var i = 0; i < Libraries.length; i++) {
		for(var k = 0; k < Libraries[i].length; k++) {
			logger.debug(Libraries[i][k].fileNames);
			if(Libraries[i][k].fileNames.indexOf(uri) > -1) {
				var path  = Libraries[i][k].dir + '/' + uri;
				var pageText = fs.readFileSync(path).toString();
				logger.debug('Writing file from path: ' + path);
				callback(pageText, true);
			}
		}
	}
};

LibraryManager.prototype.getLibraryContentsAsString = function(uri, callback) {
	getLibraryContents(uri, callback);
};

// Accepts a response object and parses a view into it
LibraryManager.prototype.serveLibrary = function(uri, res, callback) {
	var type = uri.indexOf('js') > 0 ? 'js' : 'css';
	getLibraryContents(uri, function(pageText, found) {
		if(found) {
			if(type === 'js') {
				res.writeHead(200, {
					'Content-Type': 'application/javascript',
					'cache-control':'no-cache'
				});
				res.end(pageText);
				if(typeof(callback) !== 'undefined') {
					callback(null, testing.libraryManager.jscss);
				}
			}
			else {
				res.writeHead(200, {
					'Content-Type': 'text/css',
					'cache-control':'no-cache'
				});
				res.end(pageText);
				if(typeof(callback) !== 'undefined') {
					callback(null, testing.libraryManager.jscss);
				}
			}
		}
		else {
			res.writeHead(404, {'Content-Type': 'text/plain'});
			res.end(constants.LIBRARY_NOT_FOUND + ' ' + uri);
			if(typeof(callback) !== 'undefined') {
				callback(null, testing.libraryManager.notfound);
			}
		}
	});
};
