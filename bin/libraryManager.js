var fs = require('fs');
var logging = require('./logging.js');
var async = require('async');

var libraries;

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

// Accepts a response object and parses a view into it
LibraryManager.prototype.init = function(mLibraries) {
	libraries = mLibraries;
}

// Accepts a response object and parses a view into it
LibraryManager.prototype.serveLibrary = function(res) {

}