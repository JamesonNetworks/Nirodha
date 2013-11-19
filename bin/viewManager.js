var fs = require('fs');
var logging = require('./logging.js');
var async = require('async');

var INCLUDES = new String('{includes}');
var TEMPLATES = new String('{templates}');
var scriptStart = '<script type="text/javascript" src="';
var scriptEnd = '"></script>';
var cssStart = "";
var cssEnd = "";

var view;

/**
 * Expose the root.
 */

exports = module.exports = new ViewManager;

/**
 * Expose `ViewManager`.
 */

exports.ViewManager = ViewManager;

function ViewManager() {

}

ViewManager.prototype.init = function(pView) {
	view = pView;
}

// Accepts a response object and parses a view into it
ViewManager.prototype.parse = function(res) {

/*
*	Parse the libraries included in the thtml
*/

	// Get the page text for the view by removing the .html portion of the request and parsing the view
	var pageText = fs.readFileSync(view).toString();

	// TODO: Fix this includes
	var includes = JSON.parse(fs.readFileSync(view.substring(0, view.length-5) + '.json').toString());
	var jsfiles = includes.js;

	logging('Included js: ' + JSON.stringify(jsfiles));

	// Locate the include section for javascript/css
	var startOfIncludes = pageText.indexOf(INCLUDES);
	logging('Includes length: ' + INCLUDES.length, 7);
	var endOfIncludes = startOfIncludes + INCLUDES.length;

	logging('JS/CSS include start: ' + startOfIncludes, 7);
	logging('JS/CSS include end: ' + endOfIncludes, 7);
	var firstPartOfPage = pageText.substring(0, startOfIncludes);
	var lastPartOfPage = pageText.substring(endOfIncludes, pageText.length);

	async.series([
		// Insert js files
		function(cb) {
			logging('Entering loop to add libraries', 7);
			logging('Library lengths: ' + jsfiles.length, 7);
			// Insert references to the new libraries
			var includes = "";
			for(var i = 0; i < jsfiles.length; i++) {
				logging('Inserting the following library: ' + jsfiles[i], 7)
				includes += (scriptStart + jsfiles[i] + scriptEnd);
				if(i == jsfiles.length-1) {
					cb(null, includes);
				}
			}
		}
		//Insert css files

		//Insert template files
	], 
	function(err, results) {
		logging('Insertings the following results: ' + results);
		res.end(firstPartOfPage + results[0].toString() + lastPartOfPage);
	});
/*
*	Parse the templates included in the thtml
*/

	// TODO: Add support for templates
	// Locate the include section for templates
	// var startOfTemplates = pageText.indexOf(TEMPLATES);
	// var endOfTemplates = pageText.indexOf(startOfTemplates + TEMPLATES.length);
	// logging('Templates include Start: ' + startOfTemplates, 7);
	// logging('Templates include End: ' + endOfTemplates, 7);

	// return firstPartOfPage + lastPartOfPage;
}