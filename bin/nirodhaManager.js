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

// Filters
var isJsFile = utils.isJsFile;
var isCssFile = utils.isCssFile;

exports = module.exports = new NirodhaManager();

/**
 * Expose `nirodhaManager`.
 */

exports.nirodhaManager = NirodhaManager;

function NirodhaManager() {
}

var findCSSFiles = utils.findCSSFiles;
var findJsFiles = utils.findJsFiles;

function parse(res, directory, view, callback) {
	/*
	*	Parse the libraries included in the thtml
	*/
	logger.debug('Directory: ' + directory);
	logger.debug('View: ' + view);
	if(typeof(directory) === 'undefined') {
		directory = this.directory;
	}
	if(typeof(view) === 'undefined') {
		view = this.view;
	}

	logger.debug('Directory: ' + directory);
	logger.debug('View: ' + view);

	if(typeof(view) === 'undefined' || typeof(directory) === 'undefined') {
		logger.warn('Invalid directory: ' + directory + ' or view: ' + view);
		throw new Error('Invalid arguments passed to nirodhaManager.parse');
	}

	// Get the page text for the view by removing the .html portion of the request and parsing the view
	var pageText = fs.readFileSync(directory + view).toString();

	var includes = JSON.parse(fs.readFileSync(directory + view.substring(0, view.length-5) + '.json').toString());

	// Get a list of the strings to search for in the html file

	var addToPageText = function(finalText) {
		pageText = finalText;
	};

	async.series([
		function(cb) {
			for(var i = 0; i < includes.length; i++) {
				// logger.log('index: ' + i + ' , pageText: ' + pageText);
				insertLibrariesAt(pageText, includes[i], addToPageText);
			}
			cb();
		},
		function(cb) {
			// Add templates in
			var template_filename = directory + '/custom/templates/' + view.substring(0, view.length-5) + '_templates.html';
			logger.debug('Adding the templates html to the core html file...');
			logger.debug('Loading the following file: ' + template_filename);
			var template_text = fs.readFileSync(template_filename).toString();

			var start = pageText.indexOf(TEMPLATE_KEY);
			var end  = pageText.indexOf(TEMPLATE_KEY) + TEMPLATE_KEY.length;
			var firstpart = pageText.substring(0, start);
			var lastpart = pageText.substring(end, pageText.length);
			res.end(firstpart + template_text + lastpart);
			cb();
		}
	], function(err) {
		logger.warn(err);
		if(typeof(callback) !== 'undefined') {
			callback(null, testing.nirodhaManager.html);
		}
	});
}

function handleRequest (req, res, rootDirectory, htmlFiles, callback) {
	logger.debug('req.url: ' + req.url);
	// Parse the request url
	var URI = req.url.substring(1, req.url.length);
	logger.log('Requested URI is: ' + URI, 7);
	logger.log('Index of html in uri: ' + (URI.indexOf('html') > 0), 7);

	if(URI.indexOf('html') > 0) {
		// Look for the file in the html file list
		logger.debug('HtmlFiles length: ' + htmlFiles.length);
		URI = URI.split('?')[0];
		for(var i = 0; i < htmlFiles.length; i++) {
			logger.debug('Current file: ' + htmlFiles[i]);
			logger.debug('Comparing ' + htmlFiles[i] + ' to ' + URI);
			if(htmlFiles[i] === URI.split('?')[0]) {
				logger.log('A matching view for ' + req.url + ' has been found, reading and serving the page...');

				logger.debug('Serving ' + rootDirectory + ' as root directory and ' + URI + ' as view');

				// Set the headers to NEVER cache results
				res.writeHead(200, {
					'Content-Type': 'text/html',
					'cache-control':'no-cache'
				});
				// Call into the ViewManager and parse the pages
				parse(res, rootDirectory, URI, callback);
			}

		}
	}
	// Look for a library matching the request
	else if(URI.indexOf('.js') > 0 || URI.indexOf('.css') > 0) {
		logger.debug('Handing ' + req.url + ' to the library manager...');
		lm.serveLibrary(URI, res, callback);
	}
	else if(URI === '') {
		if(typeof(htmlFiles)=== 'undefined') {
			throw new Error('htmlFiles not defined in nirodhaManager');
		}
		logger.log('There was no request URI, serving links to each view...');
		var pageText = '';
		for(var k = 0; k < htmlFiles.length; k++) {
			pageText += '<a href='+ htmlFiles[k] + '> ' + htmlFiles[k] + '</a> \n';
		}
		// Set the headers to NEVER cache results
		res.writeHead(200, {
			'Content-Type': 'text/html',
			'cache-control':'no-cache'
		});
		res.write(pageText);
		res.end();
		if(typeof(callback) !== 'undefined') {
			callback(null, testing.nirodhaManager.html);
		}
	}
	// Look for a static file in the static files directory
	else {
		var uri = url.parse(req.url).pathname;
		var filename = path.join(rootDirectory + '/custom/static/', decodeURI(uri));
		var stats;

		logger.log('Attempting to serve a static asset matching ' + uri);
		logger.log('Using ' + filename + ' as filename...', 7);

		if (fs.existsSync(filename)) {
			stats = fs.lstatSync(filename);
			var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
			logger.log('mimeType: ' + mimeType, 7);

			if(typeof(callback) !== 'undefined') {
				callback(null, testing.nirodhaManager.file);
			}
			else {
				res.writeHead(200, {'Content-Type': mimeType} );
				var fileStream = fs.createReadStream(filename);
				fileStream.pipe(res);
			}
		}
		else {
			filename = path.join(rootDirectory + '/static/', decodeURI(uri));
			logger.log('No matching asset found in project custom directory for ' + uri + '...', 4);
			logger.log('Attempting to serve a static asset matching from libs ' + uri);
			logger.log('Using ' + filename + ' as filename...', 7);

			if(!fs.existsSync(filename)) {
				logger.log('No static asset was found for ' + filename + '...', 4);
				res.writeHead(404, {'Content-Type': 'text/plain'});
				res.write('404 Not Found\n');
				res.end();
				if(typeof(callback) !== 'undefined') {
					callback(null, testing.nirodhaManager.notfound);
				}
				return;
			}
		}
	}
}

NirodhaManager.prototype.setRootDirectory = function(rtDir) {
	this.rootDirectory = rtDir;
};

NirodhaManager.prototype.setHtmlFiles = function(htFiles) {
	this.htmlFiles = htFiles;
	logger.debug('HTML Files: ' + this.htmlFiles);
};

NirodhaManager.prototype.handleRequest = function(req, res, done) {
	logger.debug('HTML Files: ' + this.htmlFiles);
	handleRequest(req, res, this.rootDirectory, this.htmlFiles, done);
};

NirodhaManager.prototype.setSettings = function(settings) {
	this.settings = settings;
};

NirodhaManager.prototype.init = function(pView, pDirectory) {
	directory = pDirectory;
	view = pView;
};

NirodhaManager.prototype.findJsFiles = function(resultFileList) {
	return findJsFiles(resultFileList);
};

NirodhaManager.prototype.findCSSFiles = function(resultFileList) {
	return findCSSFiles(resultFileList);
};

NirodhaManager.prototype.deploy = function(settings, viewname, callback) {

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

	deployedEventListener.on('viewDeployed', function(event) {
		numberOfViewsToDeploy--;
		if(numberOfViewsToDeploy === 0) {
			if(typeof(callback) !== 'undefined' ) {
				callback(testing.nirodhaManager.viewdeployed);
			}
		}
	});
	var searchDirectories = utils.getSearchDirectories(utils.getNirodhaPath());

	// TODO: Fix this includes
	_.each(views, function(viewToDeploy) {
		var viewObject = view;
		viewObject.init(viewToDeploy);
		viewObject.deploy(deployedEventListener);
	});
};

// Accepts a response object and parses a view into it
NirodhaManager.prototype.parse = function(res) {
	parse(res);
};
