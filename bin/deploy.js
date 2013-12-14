var logging = require('./logging.js');
var fs = require('fs');
var path = require('path');
var settings = require('../settings.json');
var dm = require('./deployManager.js');

function deployNirodhaView(viewname) {
	dm.deploy(viewname);
}

module.exports = function (args) {
	logging('Entering Deployment Routine...', 6);
	logging('Using arguments: ' + args);

	if(args.length != 1) {
		logging('Received more than 1 argument');
		// if(args[0] === 'view' && args.length == 2) {

		// }
		// else {
		// 	logging('Received an unknown command, quitting');
		// }
	}
	logging('Deploying the following views: index.html...', 6);
	// Create the folder with the structure
	deployNirodhaView(args[0]);
}