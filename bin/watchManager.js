var utils = require('./utilities.js');
var logger = require('jslogging');
var testing = require('../testing.json');

var nm = require('./nirodhaManager.js');
try {
  var settings = require('../settings.json');
}
catch(err) {
  logger.warn('No settings file found, using default settings...');
  var settings = require('../settings_template.json');
}

exports = module.exports = new WatchManager();

/**
 * Expose `nirodhaManager`.
 */

exports.watchManager = WatchManager;

function WatchManager() {
}

WatchManager.prototype.deploy = function(view, callback) {

    logger.info('Entering Deployment Routine...');

    nm.setSettings(settings);

    logger.info('Deploying the following views: ' + JSON.stringify(view));

    // Create the folder with the structure
    nm.deployForWatch(settings, view, callback);
}

WatchManager.prototype.projectFileChangeEventHandler = function(filename, callback) {
    var view = utils.getViewFromFileName(filename);
    if(typeof(view) !== undefined) {
        this.deploy(view, callback);            
    }
}