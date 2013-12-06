var fs = require('fs');
var logging = require('./logging.js');
var async = require('async');

var INCLUDES = new String('{includes}');
var TEMPLATES = new String('{templates}');
var scriptStart = '<script type="text/javascript" src="';
var scriptEnd = '"></script>\n';

var styleStart = '<link rel="stylesheet" href="';
var styleEnd = '">\n';

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
	var cssfiles = includes.css;

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
			logging('Entering loop to add js libraries', 7);
			logging('JS Library lengths: ' + jsfiles.length, 7);
			// Insert references to the new js library files
			var jsincludes = "";
			for(var i = 0; i < jsfiles.length; i++) {
				logging('Inserting the following js library: ' + jsfiles[i], 7)
				jsincludes += (scriptStart + jsfiles[i] + scriptEnd);
				if(i == jsfiles.length-1) {
					cb(null, jsincludes);
				}
			}
		},
		//Insert css files
		function(cb) {
			logging('Entering loop to add css libraries', 7);
			logging('CSS Library length: ' + cssfiles.length, 7);
			// Insert references to the new css library files
			var cssincludes = "";
			for(var i = 0; i < cssfiles.length; i++) {
				logging('Inserting the following css library: ' + cssfiles[i], 7);
				cssincludes += (styleStart + cssfiles[i] + styleEnd);
				if(i == cssfiles.length-1) {
					cb(null, cssincludes);
				}
			}
		},
		//Insert template files
		function(cb) {
			var template_filename = './custom/templates/' + view.substring(0, view.length-5) + '_templates.html'
			logging('Adding the templates html to the core html file...');
			logging('Loading the following file: ' + template_filename);
			var template_text = fs.readFileSync(template_filename).toString();
			var template_container = {};
			template_container.template_filename = template_filename;
			template_container.template_text = template_text;
			cb(null, template_container);
		}
	], 
	function(err, results) {
		logging('Inserting the following js results: ' + results[0]);
		logging('Inserting the following css results: ' + results[1]);
		logging('Inserting the templates for ' + results[2].template_filename  + '...');
		logging('Inserting the following templates: ' + results[2].template_text, 7);
		res.end(firstPartOfPage + results[2].template_text + results[0].toString() + results[1].toString() + lastPartOfPage);
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