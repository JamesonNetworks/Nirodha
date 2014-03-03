var logger = require('./logging.js');
var fs = require('fs');
var path = require('path');
var settings = require('../settings.json');
var dm = require('./deployManager.js');

function deployNirodhaView(viewname) {
	dm.deploy(viewname);
}

module.exports = function (args) {
	logger.log('Entering Deployment Routine...', 6);
	logger.log('Using arguments: ' + args);

	if(args.length != 1) {
		logger.log('Received more than 1 argument');
	}
	logger.log('Deploying the following views: index.html...', 6);
	// Create the folder with the structure
	deployNirodhaView(args[0]);
};
