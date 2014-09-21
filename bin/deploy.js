var logger = require('jslogging');

module.exports = function (args, settings, callback) {

	logger.debug('Entering Deployment Routine...');
	logger.debug('Using arguments: ' + args);

    var nm = require('./nirodhaManager.js');
    nm.setSettings(settings);

	if(args.length !== 1) {
		logger.debug('Received more than 1 argument');
	}
	// Create the folder with the structure
	nm.deploy(settings, args[0], callback);
};
