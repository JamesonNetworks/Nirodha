var fs = require('fs');
var logging = require('./logging.js');

var INCLUDE_START = '#sect:includes';
var INCLUDE_END = '#endsect:includes';

var TEMPLATES_START = '#sect:templates';
var TEMPLATES_END = '#endsect:templates';

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

ViewManager.prototype.parse = function() {
	// Get the page text for the view
	var pageText = fs.readFileSync(view.substring(0, view.length-5) + '.thtml').toString();
	logging(pageText, 7);

	// Locate the include section for javascript/css
	var startOfIncludes = pageText.indexOf(INCLUDE_START);
	var endOfIncludes = pageText.indexOf(INCLUDE_END);
	logging('JS/CSS include start: ' + startOfIncludes, 7);
	logging('JS/CSS include end: ' + endOfIncludes, 7);


	// Locate the include section for templates
	var startOfIncludes = pageText.indexOf(TEMPLATES_START);
	var endOfIncludes = pageText.indexOf(TEMPLATES_END);
	logging('Templates include Start: ' + startOfIncludes, 7);
	logging('Templates include End: ' + endOfIncludes, 7);
	return pageText;
}