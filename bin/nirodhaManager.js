var logger = require('jslogging'),
	fs = require('fs'),
	_ = require('underscore'),
	eventEmitter = require('events').EventEmitter;

var testing = require('../testing.json');
var view = require('./view.js');

var view;
var directory;

exports = module.exports = new NirodhaManager();

/**
 * Expose `nirodhaManager`.
 */

exports.nirodhaManager = NirodhaManager;

function NirodhaManager() {
}

NirodhaManager.prototype.setSettings = function(settings) {
	this.settings = settings;
};

NirodhaManager.prototype.init = function(pView, pDirectory) {
	directory = pDirectory;
	view = pView;
};

NirodhaManager.prototype._deploy = function(minify, settings, viewname, callback) {
	var views = [];
	if(typeof(viewname) === 'undefined') {

		logger.debug('No viewname specified!');
		logger.info('Deploying all views...');

		views = fs.readdirSync('./');
		views = _.filter(views, function(filename) { 
			if(filename.indexOf('.html') > -1) {
				return true;
			}
			else {
				return false;
			}
		}).map(function(filename) {
			return filename.split('.')[0];
		});
	}
	else {
		views.push(viewname);		
	}

	if(!fs.existsSync('deploy')) {
		fs.mkdirSync('deploy');
	}
	if(!fs.existsSync('deploy/js')) {
		fs.mkdirSync('deploy/js');
	}
	if(!fs.existsSync('deploy/css')) {
		fs.mkdirSync('deploy/css');
	}

	/*
	*	Parse the libraries included in the thtml
	*/

	logger.debug('nirodhaManager Current Views: ' + JSON.stringify(views));

	var deployedEventListener = new eventEmitter();
	deployedEventListener.once('done', function() {
		if(typeof(callback) !== 'undefined') {
			callback(testing.nirodhaManager.viewdeployed);
		}
	});

	var deployCallback = function() {
		deployedEventListener.emit('done');
	};

	for(var i = 0; i < views.length; i++) {
		var viewObject = view;
		viewObject.init(views[i]);
		viewObject.deploy(minify, deployCallback);
	}
};

NirodhaManager.prototype.deploy = function(settings, viewname, callback) {
	this._deploy(true, settings, viewname, callback);
};

NirodhaManager.prototype.deployForWatch = function(settings, viewname, callback) {
	this._deploy(false, settings, viewname, callback);
};
