var logger = require('jslogging');
var fs = require('fs');
var path = require('path');
var async = require('async');
var view = require('./view.js');
var project = require('./project.js');
var testing = require('../testing.json');

module.exports = function (args, settings, callback) {
	logger.debug('Entering create...', 6);
	logger.debug('Args: ' + JSON.stringify(args));
	logger.debug('Settings: ' + JSON.stringify(settings));

	if(args.length != 1) {
		logger.debug('Received different number from 1 argument, checking to see if this is to create a view');
		if(args[0] === 'view' && args.length == 2) {
			logger.info('Creating a view for ' + args[1]);

			view.init(args[1]);
			view.create(callback);

			//nm.createView(args[1], null, callback);
		}
		else {
			logger.info('Received an unknown command, quitting');
			callback(testing.create.unknown);
		}
	}
	else {
		logger.log('Creating a project with the name ' + args[0] + '...', 6);
		// Create the folder with the structure
		if(fs.existsSync(args[0])) {
			logger.log('Error creating directory, it already exists!', 0);
			if(typeof(callback) !== 'undefined') {
				callback(testing.create.projectexists);
			}
		}
		else {
			project.init(args[0]);
			project.create(callback);
		}
	}
};
