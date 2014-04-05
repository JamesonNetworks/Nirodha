var logger = require('./logging.js');
var fs = require('fs');
var path = require('path');
var dm = require('./deployManager.js');

function deployNirodhaView(viewname, callback) {
	dm.deploy(viewname, callback);
}

module.exports = function (args, callback) {

	if(typeof(callback) !== 'undefined') {
		// There should not be a callback with this function,
		// callbacks on this are for testing only, so set 
		// the log level to no logging
		logger.setLogLevel(-1);
	}
	else {
		// The callback is not defined, put a dummy thing here
		// so the code doesn't crap out
		callback = function(statement) {
		}
	}

	logger.log('Entering Deployment Routine...', 6);
	logger.log('Using arguments: ' + args);

	if(args.length != 1) {
		logger.log('Received more than 1 argument');
	}
	logger.log('Deploying the following views: ' + JSON.stringify(args[0]), 6);
	// Create the folder with the structure
	deployNirodhaView(args[0], callback);
};
