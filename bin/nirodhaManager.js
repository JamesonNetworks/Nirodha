var logger = require('jslogging'),
	fs = require('fs'),
	async = require('async'),
	compressor = require('node-minify'),
	url = require('url'),
	path = require('path'),
	_ = require('underscore'),
	eventEmitter = require('events').EventEmitter;

var utils = require('./utilities.js');
var lm = require('./libraryManager.js');
var testing = require('../testing.json');
var view = require('./view.js');

// Constants
var TEMPLATE_KEY = '{templates}';

var scriptStart = '<script type="text/javascript" src="';
var scriptEnd = '"></script>\n';

var styleStart = '<link rel="stylesheet" href="';
var styleEnd = '">\n';

var mimeTypes = {
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "js": "text/javascript",
    "css": "text/css",
    "gif": "image/gif",
    "ico": "image/gif",
    "svg": "image/svg+xml"
};

var view;
var directory;

// Other crap
// Method to get all files in directories
var walkSync = utils.walkSync;

exports = module.exports = new NirodhaManager();

/**
 * Expose `nirodhaManager`.
 */

exports.nirodhaManager = NirodhaManager;

function NirodhaManager() {
}

var findCSSFiles = utils.findCSSFiles;
var findJsFiles = utils.findJsFiles;

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

	numberOfViewsToDeploy = views.length;
	var deployedEventListener = new eventEmitter();
	var doneFired = false;
	deployedEventListener.once('done', function(event) {
		if(typeof(callback) !== 'undefined') {
			callback(testing.nirodhaManager.viewdeployed);
		}
	});
	var searchDirectories = utils.getSearchDirectories(utils.getNirodhaPath());
	var deployCallback = function() {
		deployedEventListener.emit('done');
	}

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
