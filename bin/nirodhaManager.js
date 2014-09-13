var logger = require('jslogging'),
	fs = require('fs'),
	async = require('async'),
	compressor = require('node-minify'),
	url = require('url'),
	path = require('path'),
	_ = require('underscore');

var utils = require('./utilities.js');
var lm = require('./libraryManager.js');
var testing = require('../testing.json');

// Constants
var TEMPLATE_KEY = '{templates}';

var scriptStart = '<script type="text/javascript" src="';
var scriptEnd = '"></script>\n';

var styleStart = '<link rel="stylesheet" href="';
var styleEnd = '">\n';

var LIBRARY_NOT_FOUND = 'There is no view or library file which corresponds to the request';
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

var searchDirectories = [];

// Other crap
// Method to get all files in directories
var walkSync = utils.walkSync;

// Filters
var isHtmlFile = utils.isHtmlFile;
var isJsFile = utils.isJsFile;
var isCssFile = utils.isCssFile;

var settings;

exports = module.exports = new nirodhaManager();

/**
 * Expose `nirodhaManager`.
 */

exports.nirodhaManager = nirodhaManager;

function nirodhaManager() {
}

// Helper function for creating files
function copyFile(source, target, cb) {
	var cbCalled = false;

	var rd = fs.createReadStream(source);
	rd.on("error", function(err) {
		done(err);
	});
	var wr = fs.createWriteStream(target);
	wr.on("error", function(err) {
		done(err);
	});
	wr.on("close", function(ex) {
		done();
	});
	rd.pipe(wr);

	function done(err) {
		if (!cbCalled) {
			cb(err);
			cbCalled = true;
		}
	}
}

function generateJsAndCSSForIncludeSection(libobject, view) {
	logger.debug('In generateJsAndCSSForIncludeSection...');

	var jsPageText = '';
	var cssPageText = '';

	var title = libobject.title.substring(1, libobject.title.length-1);

	logger.debug('Title: ' + title);

	async.series([
		// Insert js files
		function(cb) {
			logger.debug('Entering loop to add js libraries');

			var jsfiles = libobject.libs.js;
			logger.debug('JS Library lengths: ' + jsfiles.length);

			if(jsfiles.length === 0) {
				cb(null, null);
			}
			else {
				var libraryCallback = function(result, found) {
					logger.log('Found ' + jsfiles[i] + '? ' + found, 7);
					//logger.log('File contents: ' + result, 7);
					if(found) {
						jsPageText += result + '\n';
						//logger.log('jsPageText so far: ' + jsPageText, 7);
					}
				};
				for(var i = 0; i < jsfiles.length; i++) {

					logger.debug('Inserting the following js library: ' + jsfiles[i]);
					lm.getLibraryContentsAsString(jsfiles[i], libraryCallback);

					if(i == jsfiles.length-1) {
						cb(null, null);
					}
				}
			}
		},
		//Insert css files
		function(cb) {
			logger.log('Entering loop to add css libraries', 7);
			// Insert references to the new css library files
			var cssincludes = "";

			var cssfiles = libobject.libs.css;
			logger.log('CSS Library length: ' + cssfiles.length, 7);

			if(cssfiles.length === 0) {
				cb(null, null);
			}
			else {
				var libraryCallback = function(result, found) {
					logger.log('Found ' + cssfiles[i] + '? ' + found, 7);
					//logger.log('File contents: ' + result, 7);
					if(found) {
						cssPageText += result + '\n';
						//logger.log('jsPageText so far: ' + jsPageText, 7);
					}
				};
				for(var i = 0; i < cssfiles.length; i++) {
					logger.log('Inserting the following css library: ' + cssfiles[i], 7);
					lm.getLibraryContentsAsString(cssfiles[i], libraryCallback);

					if(i == cssfiles.length-1) {
						cb(null, cssincludes);
					}
				}
			}
		}
	], 
	function(err, results) {
		logger.debug('Results in generateCss: ' + JSON.stringify(results));
		// Write the files out
		fs.writeFileSync('./deploy/js/' + view + '-' + title + '.js.temp', jsPageText);
		fs.writeFileSync('./deploy/css/' + view + '-' + title + '.css.temp', cssPageText);

		// Minify the files
		new compressor.minify({
		type: 'gcc',
		fileIn: './deploy/js/' + view + '-' + title + '.js.temp',
		fileOut: './deploy/js/' + view + '-' + title + '.js',
		callback: function(err, min){
			if(err) {
				logger.log('Calling error for minifying ' + './deploy/js/' + view + '-' + title + '.js.temp', 3);
				logger.log(err, 3);
			}
			fs.unlinkSync('./deploy/js/' + view + '-' + title + '.js.temp');
			new compressor.minify({
			type: 'yui-css',
			fileIn: './deploy/css/' + view + '-' + title + '.css.temp',
			fileOut: './deploy/css/' + view + '-' + title + '.css',
			callback: function(err, min){
				if(err) {
					logger.log('Calling error for minifying ' + './deploy/css/' + view + '-' + title + '.css.temp', 3);
					logger.log(JSON.stringify(err), 3);
				}
				fs.unlinkSync('./deploy/css/' + view + '-' + title + '.css.temp');
				logger.debug('Results returning from generateCSs: ' + JSON.stringify(results));
				}
			});
			}
		});
	});
}

function insertLibrariesAt(text, libobject, callback) {

	// logger.log('text dump: ' + JSON.stringify(text));
	logger.debug('libobject dump: ' + JSON.stringify(libobject));
	var start = text.indexOf(libobject.title);
	var end = start + libobject.title.length;
	var firstpart = text.substring(0, start);
	var lastpart = text.substring(end, text.length);

	var jsfiles = libobject.libs.js;
	var cssfiles = libobject.libs.css;

	async.series([
		// Insert js files
		function(cb) {
			logger.log('Entering loop to add js libraries', 7);
			logger.log('JS Library lengths: ' + jsfiles.length, 7);
			// Insert references to the new js library files
			var jsincludes = "";
			if(jsfiles.length === 0) {
				cb(null, jsincludes);
			}
			else {
				for(var i = 0; i < jsfiles.length; i++) {
					logger.log('Inserting the following js library: ' + jsfiles[i], 7);
					jsincludes += (scriptStart + jsfiles[i] + scriptEnd);
					if(i == jsfiles.length-1) {
						cb(null, jsincludes);
					}
				}
			}
		},
		//Insert css files
		function(cb) {
			logger.log('Entering loop to add css libraries', 7);
			logger.log('CSS Library length: ' + cssfiles.length, 7);
			// Insert references to the new css library files
			var cssincludes = "";
			if(cssfiles.length === 0) {
				cb(null, cssincludes);
			}
			else {
				for(var i = 0; i < cssfiles.length; i++) {
					logger.log('Inserting the following css library: ' + cssfiles[i], 7);
					cssincludes += (styleStart + cssfiles[i] + styleEnd);
					if(i == cssfiles.length-1) {
						cb(null, cssincludes);
					}
				}
			}
		}
	], 
	function(err, results) {
		logger.debug('Inserting the following js results: ' + results[0]);
		logger.debug('Inserting the following css results: ' + results[1]);
		
		callback(firstpart + results[0].toString() + results[1].toString() + lastpart);
	});
}

function createView(settings, viewname, optdirectory, callback) {
	var dir;
	var nirodhaPath  = utils.getNirodhaPath();

	async.series([
		function(cb) {
			if(optdirectory) {
				dir = optdirectory;
				cb(null, true);
			}
			else {
				dir = './';
				cb(null, true);
			}
		},
		function(cb) {
			// Copy in the default view
			logger.debug('Copying the default view, this is settings: ' + JSON.stringify(settings));
			copyFile(nirodhaPath + 'tmpl/defaultView.html', dir + viewname + '.html', function(err) {
				if(err) {
					logger.warn('Problem copying default view: ' + err, 0);
					cb(err);
				}
				else {
					logger.log('Successfully created ' + viewname + '.html');
					cb(null, true);
				}
			});
		},
		function(cb) {
			// Copy in the default javascript
			logger.log('Copying the default view javascript, this is settings: ' + JSON.stringify(settings));
			copyFile(nirodhaPath + 'tmpl/defaultView.js', dir + 'custom/js/' + viewname + '.js', function(err) {
				if(err) {
					logger.warn('Problem copying default js: ' + err, 0);
					cb(err);
				}
				else {
					logger.log('Successfully created ' + viewname + '.js');
					cb(null, true);
				}
			});
		},
		function(cb) {
			// Copy in the default css
			copyFile(nirodhaPath + 'tmpl/defaultView.css', dir + 'custom/css/' + viewname + '.css', function(err) {
				if(err) {
					logger.warn('Problem copying default css: ' + err, 0);
					cb(err);
				}
				else {
					logger.log('Successfully created ' + viewname + '.css');
					cb(null, true);
				}
			});
		},
		function(cb) {
			// Copy in the default json accessories
			copyFile(nirodhaPath + 'tmpl/defaultView.json', dir + viewname + '.json', function(err) {
				if(err) {
					logger.warn('Problem copying default css: ' + err, 0);
					cb(err);
				}
				else {
					logger.log('Successfully created ' + viewname + '.json');
					cb(null, true);
				}
			});
		},
		function(cb) {
			// Copy in the default view templates
			copyFile(nirodhaPath + 'tmpl/defaultView_templates.html', dir + 'custom/templates/' + viewname + '_templates.html', function(err) {
				if(err) {
					logger.warn('Problem copying default view: ' + err, 0);
					cb(err);
				}
				else {
					logger.log('Successfully created ' + viewname + '_templates.html');
					cb(null, true);
				}
			});
		}
	], function(err, results) {
		if(err) {
			logger.warn('An error occured copying the default view files: ' + err + ' ' + JSON.stringify(results), 3);
			logger.debug('dir: ' + process.cwd());
			logger.warn(JSON.stringify(err));
			callback(err);
		}
		else if(typeof(callback) !== 'undefined') {
			if(dir === './') {
				callback(testing.nirodhaManager.viewcreated);
			}
			else {
				callback(testing.nirodhaManager.projectcreated);
			}
		}
	});
}

function findCSSFiles(resultFileList) {
	var returnableJsFiles = "";
	//logger.log('in findJsFiles: Result files list: ' + resultFileList[i], 7);
	for(var i = 0; i < resultFileList.length; i++) {
		//logger.log('in findJsFiles: Result files list: ' + JSON.stringify(resultFileList[i].fileNames), 7);
		//logger.log('in findJsFiles: Result files list: ' + JSON.stringify(resultFileList[i].fileNames.filter(isJsFile)), 7);
		if(resultFileList[i].fileNames.filter(isCssFile).length > 0) {
			//logger.log('Js files are : ' + resultFileList[i].fileNames.filter(isJsFile), 7);
			returnableJsFiles += resultFileList[i].fileNames.filter(isCssFile).toString() + ',';
		}
	}
	return returnableJsFiles;
}

function findJsFiles(resultFileList) {
	var returnableJsFiles = "";
	//logger.log('in findJsFiles: Result files list: ' + resultFileList[i], 7);
	for(var i = 0; i < resultFileList.length; i++) {
		//logger.log('in findJsFiles: Result files list: ' + JSON.stringify(resultFileList[i].fileNames), 7);
		//logger.log('in findJsFiles: Result files list: ' + JSON.stringify(resultFileList[i].fileNames.filter(isJsFile)), 7);
		if(resultFileList[i].fileNames.filter(isJsFile).length > 0) {
			//logger.log('Js files are : ' + resultFileList[i].fileNames.filter(isJsFile), 7);
			returnableJsFiles += resultFileList[i].fileNames.filter(isJsFile).toString() + ',';
		}
	}
	return returnableJsFiles;
}

function parse(res, directory, view, callback) {
	/*
	*	Parse the libraries included in the thtml
	*/
	logger.log('Directory: ' + directory);
	logger.log('View: ' + view);
	if(typeof(directory) === 'undefined') {
		directory = this.directory;
	}
	if(typeof(view) === 'undefined') {
		view = this.view;
	}

	logger.log('Directory: ' + directory);
	logger.log('View: ' + view);

	if(typeof(view) === 'undefined' || typeof(directory) === 'undefined') {
		logger.log('Invalid directory: ' + directory + ' or view: ' + view);
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
			logger.log('Adding the templates html to the core html file...');
			logger.log('Loading the following file: ' + template_filename);
			var template_text = fs.readFileSync(template_filename).toString();

			var start = pageText.indexOf(TEMPLATE_KEY);
			var end  = pageText.indexOf(TEMPLATE_KEY) + TEMPLATE_KEY.length;
			var firstpart = pageText.substring(0, start);
			var lastpart = pageText.substring(end, pageText.length);
			res.end(firstpart + template_text + lastpart);
			cb();
		}
	], function(err, result) {
		if(typeof(callback) !== 'undefined') {
			callback(null, testing.nirodhaManager.html);
		}
	});
}

function handleRequest (req, res, rootDirectory, htmlFiles, callback) {
	logger.log('req.url: ' + req.url);
	if(req.url) {
		// Parse the request url
		var URI = req.url.substring(1, req.url.length);
		logger.log('Requested URI is: ' + URI, 7);
		logger.log('Index of html in uri: ' + (URI.indexOf('html') > 0), 7);

		if(URI.indexOf('html') > 0) {
			// Look for the file in the html file list
			logger.log('HtmlFiles length: ' + htmlFiles.length);
			URI = URI.split('?')[0];
			for(var i = 0; i < htmlFiles.length; i++) {
				logger.log('Current file: ' + htmlFiles[i]);
				logger.log('Comparing ' + htmlFiles[i] + ' to ' + URI);
				if(htmlFiles[i] === URI.split('?')[0]) {
					logger.log('A matching view for ' + req.url + ' has been found, reading and serving the page...');

					logger.log('Serving ' + rootDirectory + ' as root directory and ' + URI + ' as view');

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
			logger.log('Handing ' + req.url + ' to the library manager...');
			lm.serveLibrary(URI, res, callback);
		}
		else if(URI === '') {
			if(typeof(htmlFiles)=== 'undefined') {
				throw Error('htmlFiles not defined in nirodhaManager');
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
		}
		// Look for a static file in the static files directory
		else {
			var uri = url.parse(req.url).pathname;
			var filename = path.join(rootDirectory + '/custom/static/', unescape(uri));
			var stats;

			logger.log('Attempting to serve a static asset matching ' + uri);
			logger.log('Using ' + filename + ' as filename...', 7);

			if(typeof(callback) !== 'undefined') {
				callback(null, testing.nirodhaManager.notfound);
			}
			else {
				if (fs.existsSync(filename)) {
					stats = fs.lstatSync(filename);
				}
				else {
					filename = path.join(rootDirectory + '/static/', unescape(uri));
					logger.log('No matching asset found in project custom directory for ' + uri + '...', 4);
					logger.log('Attempting to serve a static asset matching from libs ' + uri);
					logger.log('Using ' + filename + ' as filename...', 7);

					if(fs.existsSync(filename)) {
						logger.log('No static asset was found for ' + filename + '...', 4);
						res.writeHead(404, {'Content-Type': 'text/plain'});
						res.write('404 Not Found\n');
						res.end();
						return;
					}
				}

				if ((typeof(stats) !== 'undefined') && stats.isFile()) {
					var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
					logger.log('mimeType: ' + mimeType, 7);
					res.writeHead(200, {'Content-Type': mimeType} );

					var fileStream = fs.createReadStream(filename);
					fileStream.pipe(res);
				}
				else {
					// Symbolic link, other?
					// TODO: follow symlinks?  security?
					res.writeHead(500, {'Content-Type': 'text/plain'});
					res.write('500 Internal server error\n');
					res.end();
				}
			}
		}
	}
	else {
		res.send(404);
		if(typeof(callback) !== 'undefined') {
			logger.log(JSON.stringify(req.url));
			callback();
		}
	}
}

nirodhaManager.prototype.setRootDirectory = function(rtDir) {
	this.rootDirectory = rtDir;
};

nirodhaManager.prototype.setHtmlFiles = function(htFiles) {
	this.htmlFiles = htFiles;
	logger.debug('HTML Files: ' + this.htmlFiles);
};

nirodhaManager.prototype.handleRequest = function(req, res, done) {
	logger.debug('HTML Files: ' + this.htmlFiles);
	handleRequest(req, res, this.rootDirectory, this.htmlFiles, done);
};

nirodhaManager.prototype.setSettings = function(settings) {
	this.settings = settings;
};

nirodhaManager.prototype.createProject = function(directoryName, callback) {
	logger.log('Creating directory: ' + directoryName, 7);
	fs.mkdirSync(directoryName);
	fs.mkdirSync(directoryName + 'custom');
	fs.mkdirSync(directoryName + 'custom/js');
	fs.mkdirSync(directoryName + 'custom/css');
	fs.mkdirSync(directoryName + 'custom/templates');
	fs.mkdirSync(directoryName + 'deploy');
	fs.mkdirSync(directoryName + 'deploy/js');
	fs.mkdirSync(directoryName + 'deploy/css');
	fs.mkdirSync(directoryName + 'custom/static');
	createView(this.settings, 'index', directoryName, callback);
};

nirodhaManager.prototype.createView = function(viewname, optdirectory, callback) {
	logger.log('In createView... ' + JSON.stringify(this.settings));
	createView(this.settings, viewname, optdirectory, callback);
};

nirodhaManager.prototype.init = function(pView, pDirectory) {
	directory = pDirectory;
	view = pView;
};

nirodhaManager.prototype.findJsFiles = function(resultFileList) {
	return findJsFiles(resultFileList);
};

nirodhaManager.prototype.findCSSFiles = function(resultFileList) {
	return findCSSFiles(resultFileList);
};

nirodhaManager.prototype.deploy = function(settings, view, callback) {

	var views = [];
	if(!view) {

		logger.debug('No view specified!');
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
		views.push(view);		
	}

	var searchDirectories = utils.getSearchDirectories(utils.getNirodhaPath());

	/*
	*	Parse the libraries included in the thtml
	*/

	// Start by searching the custom directories
	async.series(utils.deriveLibraries(searchDirectories),
	function(err, libraries) {
		if(utils.hasDuplicateLibraries(libraries)) {
			throw Error('Duplicate libraries found. This occurs when two js or css libraries have conflicting names. Resolve the conflict in your libraries before continuing.');
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
		
		var jsFiles = "";
		var cssFiles = "";

		jsFiles = findJsFiles(libraries[0]);
		jsFiles += ',' + findJsFiles(libraries[1]);
		logger.log('JS files is : ' + jsFiles, 7);
		jsFiles = jsFiles.split(',');

		cssFiles = findCSSFiles(libraries[0]);
		cssFiles += ',' + findCSSFiles(libraries[1]);
		logger.log('CSS files is : ' + cssFiles, 7);
		cssFiles = cssFiles.split(',');

		logger.log('Found the following list of JS files in Nirodha paths: ' + JSON.stringify(jsFiles), 7);
		logger.log('Found the following list of CSS files in Nirodha paths: ' + JSON.stringify(cssFiles), 7);

		logger.debug('Library manager init...');
		lm.init(libraries, jsFiles, cssFiles)

		logger.debug(JSON.stringify(views));

		if(typeof(callback) !== 'undefined' ) {
			callback(testing.nirodhaManager.viewdeployed);
		}
		// TODO: Fix this includes
		_.each(views, function(view) {
			// Get the page text for the view by removing the .html portion of the request and parsing the view
			var pageText = fs.readFileSync(view + '.html').toString();
			// var jsPageText = '';
			// var cssPageText = '';
			var includes = JSON.parse(fs.readFileSync(view + '.json').toString());

			// var jsfiles = includes.js;
			// var cssfiles = includes.css;

			// logger.log('Included js: ' + JSON.stringify(jsfiles));

			// // Locate the include section for javascript/css
			// var startOfIncludes = pageText.indexOf(INCLUDES);
			// logger.log('Includes length: ' + INCLUDES.length, 7);
			// var endOfIncludes = startOfIncludes + INCLUDES.length;

			// logger.log('JS/CSS include start: ' + startOfIncludes, 7);
			// logger.log('JS/CSS include end: ' + endOfIncludes, 7);
			// var firstPartOfPage = pageText.substring(0, startOfIncludes);
			// var lastPartOfPage = pageText.substring(endOfIncludes, pageText.length);

			async.series([
					// Generate the css and js libraries and minify for each library section
					function(cb) {
						var includeSections = [];
						for(var i = 0; i < includes.length; i++) {
							logger.debug('index: ' + i);
							generateJsAndCSSForIncludeSection(includes[i], view);
							if(i === includes.length-1) {

								cb(null, includeSections);
							}
						}
					},
					// Add in the templates
					function(cb) {
						logger.debug('view is : ' + view);
						var template_filename = './custom/templates/' + view + '_templates.html';
						logger.debug('Adding the templates html to the core html file...');
						logger.debug('Loading the following file: ' + template_filename);
						var template_text = fs.readFileSync(template_filename).toString();

						var start = pageText.indexOf(TEMPLATE_KEY);
						var end  = pageText.indexOf(TEMPLATE_KEY) + TEMPLATE_KEY.length;
						var firstpart = pageText.substring(0, start);
						var lastpart = pageText.substring(end, pageText.length);
						// logger.log('template text: ' + template_text);
						pageText = firstpart + template_text + lastpart; 
						cb(null, null);
					},
					//Copy static files
					function(cb) {
						walkSync(searchDirectories[2], function(dir, directories, fileNames) {
							logger.debug('Directory: ' + dir);
							logger.debug('FileNames: ' + JSON.stringify(fileNames));

							for(var i = 0; i < fileNames.length; i++) {
								var writeDir;
								if(err) {
									logger.log(err, 3);
								}
								if(dir === 'custom/static') {
									writeDir = 'deploy/';
								}
								else {
									logger.log('Directory to write to: ' + dir.substring(searchDirectories[2].length, dir.length), 7);
									writeDir =  'deploy' + dir.substring(searchDirectories[2].length, dir.length) + '/';
									var folderExists = fs.existsSync(writeDir);
									if(!folderExists) {
										fs.mkdirSync(writeDir);
									}
								}
								logger.log(writeDir + fileNames[i], 7);
								logger.log('FileName: ' + JSON.stringify(fileNames[i]), 7);
								var data = fs.readFileSync(dir + '/' + fileNames[i]);
								fs.writeFileSync(writeDir + fileNames[i], data);
							}
							//logger.log('Loading file ' + one + '/' + three, 7);
						});
						cb(null, null);
					}
				], 
				// Write out the final html file
				function(err, results) {
					logger.debug(JSON.stringify(results));
					logger.debug(pageText);
					logger.log('Writing final html file...');
					for(var i = 0; i < includes.length; i++) {
						var libobject = includes[i];
						var title = libobject.title.substring(1, libobject.title.length-1);
						var firstPartOfPage = pageText.substring(0, pageText.indexOf(libobject.title));
						var lastPartOfPage = pageText.substring(pageText.indexOf(libobject.title) + libobject.title.length, pageText.length);
						var jsincludes = (scriptStart + '/js/' + view  + '-' + title + '.js' + scriptEnd);
						var cssincludes = (styleStart + '/css/' + view + '-' + title + '.css' + styleEnd);
						pageText = firstPartOfPage + jsincludes + cssincludes + lastPartOfPage;
					}


					fs.writeFileSync('./deploy/' + view + '.html', pageText);
				});
			});
		});


};

// Accepts a response object and parses a view into it
nirodhaManager.prototype.parse = function(res) {
	parse(res);
};
