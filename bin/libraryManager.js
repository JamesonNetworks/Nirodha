var fs = require('fs');
var logger = require('jslogging');
var async = require('async');
var testing = require('../testing.json');
var utils = require('./utilities.js');

var LibraryContainer;
var Libraries;
var JSFiles;
var CSSFiles;

var findCSSFiles = utils.findCSSFiles;
var findJsFiles = utils.findJsFiles;

var LIBRARY_NOT_FOUND = 'There is no view or library file which corresponds to the request';

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

LibraryManager.prototype.init = function() {

	//debugger;
	if(typeof(this.includes) === 'undefined') {
		this.includes = [];
	}
	if(this.includes.length === 0 || typeof(this.includes[0].fileNames) === 'undefined') {
		// Start by searching the custom directories
		var searchDirectories = utils.getSearchDirectories(utils.getNirodhaPath());

		async.series(utils.deriveLibraries(searchDirectories),
		function(err, libraries) {
			var libraryContainer = {};

			for(var i = 0; i < libraries.length; i++) {
				for(var k = 0 ; k < libraries[i].length; k++) {
					if(typeof(libraries[i][k].fileNames) !== 'undefined' && libraries[i][k].fileNames.length > 0) {
						//debugger;
						for(var l = 0; l < libraries[i][k].fileNames.length; l++) {
							if(typeof(libraryContainer[libraries[i][k].fileNames[l]]) === 'undefined') {
								libraryContainer[libraries[i][k].fileNames[l]] = {};
								libraryContainer[libraries[i][k].fileNames[l]].dir = libraries[i][k].dir;								
							}
							else {
								logger.debug('Duplicate libraries were found, this could cause bad things to happen');
								//throw new Error('Duplicate libraries exist');
							}
						}
					}
				}
			}

			//debugger;

			if(err) {
				logger.warn(err);
			}
			//logger.info(JSON.stringify(libraries));
			if(utils.hasDuplicateLibraries(libraries)) {
				logger.debug('Mulitple libraries with the same name, ' + JSON.stringify(utils.getDuplicateLibraries(libraries)) + ', have been detected');
				//throw new Error('Duplicate libraries found. This occurs when two js or css libraries have conflicting names. Resolve the conflict in your libraries before continuing.');
			}
			
			var jsFiles = "";
			var cssFiles = "";

			jsFiles = findJsFiles(libraries[0]);
			jsFiles += ',' + findJsFiles(libraries[1]);
			logger.log('JS files is : ' + jsFiles, 7);
			jsFiles = jsFiles.split(',');

			cssFiles = findCSSFiles(libraries[0]);
			cssFiles += ',' + findCSSFiles(libraries[1]);
			logger.log('CSS files is : ' + cssFiles, 7);
			cssFiles = cssFiles.split(',');

			logger.log('Found the following list of JS files in Nirodha paths: ' + JSON.stringify(jsFiles), 7);
			logger.log('Found the following list of CSS files in Nirodha paths: ' + JSON.stringify(cssFiles), 7);

			logger.debug('Library manager init...');
			LibraryContainer = libraryContainer;
			Libraries = libraries;
			JSFiles = jsFiles === null ? [] : jsFiles;
			CSSFiles = cssFiles === null ? [] : cssFiles;
			logger.debug('Libraries contained in current lm: ' + JSON.stringify(Libraries));
		});
	}
};

var getLibraryContents = function(uri, callback) {
	logger.debug('Entering getLibraryContents...');
	logger.debug(JSON.stringify(Libraries));
	if(typeof(Libraries) === 'undefined') {
		throw new Error('No libraries defined, did you call LibraryManager.init first?');
	}
	for(var i = 0; i < Libraries.length; i++) {
		for(var k = 0; k < Libraries[i].length; k++) {
			logger.debug(Libraries[i][k].fileNames);
			if(typeof(Libraries[i][k].fileNames) !== 'undefined' && Libraries[i][k].fileNames.indexOf(uri) > -1) {
				var path  = Libraries[i][k].dir + '/' + uri;
				var pageText = fs.readFileSync(path).toString();
				logger.debug('Writing file from path: ' + path);
				callback(pageText, true);
				return;
			}
			else if((i === (Libraries.length - 1)) && (k === (Libraries[i].length - 1))) {
				callback(null, false);
			}
		}
	}
};

LibraryManager.prototype.getLibraryContentsAsString = function(uri, callback) {
	this.init();
	getLibraryContents(uri, callback);
};

function getLibraryContentsSync(uri) {
	logger.debug('Entering getLibraryContentsSync...');
	//logger.info(JSON.stringify(LibraryContainer));
	if(typeof(LibraryContainer) === 'undefined') {
		throw new Error('No libraries defined, did you call LibraryManager.init first?');
	}
	logger.debug('URI is ' + uri);

	if(typeof(LibraryContainer[uri]) !== 'undefined') {
		logger.debug('Found libray for ' + uri);
		var file = LibraryContainer[uri];
		return fs.readFileSync(file.dir + '/' + uri).toString();
	}
	else {
		return '';
	}
}

LibraryManager.prototype.getLibraryContentsSync = function(uri) {
	this.init();
	return getLibraryContentsSync(uri);
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
			res.end(LIBRARY_NOT_FOUND + ' ' + uri);
			if(typeof(callback) !== 'undefined') {
				callback(null, testing.libraryManager.notfound);
			}
		}
	});
};
