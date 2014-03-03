var fs = require('fs');
var logger = require('./logging.js');
var async = require('async');
var utils = require('./utilities.js');
var settings = require('../settings.json');
var compressor = require('node-minify');

// Handle to library manager
var lm = require('./libraryManager.js');

var TEMPLATE_KEY = '{templates}';

var scriptStart = '<script type="text/javascript" src="';
var scriptEnd = '"></script>\n';

var styleStart = '<link rel="stylesheet" href="';
var styleEnd = '">\n';

var view;
var searchDirectories = [];

/**
 * Expose the root.
 */

exports = module.exports = new DeployManager();

/**
 * Expose `DeployManager`.
 */

exports.DeployManager = DeployManager;

function DeployManager() {

}

// Method to get all files in directories
var walkSync = utils.walkSync;

// Filters
var isHtmlFile = utils.isHtmlFile;

var isJsFile = utils.isJsFile;

var isCssFile = utils.isCssFile;

DeployManager.prototype.init = function(pView) {
	view = pView;
};

function generateJsAndCSSForIncludeSection(text, libobject, view, callback) {
	logger.log('In generateJsAndCSSForIncludeSection...', 6);
	var firstPartOfPage = text.substring(0, text.indexOf(libobject.title));
	var lastPartOfPage = text.substring(text.indexOf(libobject.title) + libobject.title.length, text.length);

	var jsPageText = '';
	var cssPageText = '';

	var title = libobject.title.substring(1, libobject.title.length-1);

	logger.log('Title: ' + title);

	async.series([
		// Insert js files
		function(cb) {
			logger.log('Entering loop to add js libraries', 7);

			var jsfiles = libobject.libs.js;
			logger.log('JS Library lengths: ' + jsfiles.length, 7);
			// Insert references to the new js library files
			var jsincludes = "";

			jsincludes = (scriptStart + '/js/' + view  + '-' + title + '.js' + scriptEnd);
			lastPartOfPage = jsincludes + lastPartOfPage;

			if(jsfiles.length === 0) {
				cb(null, null);
			}
			else {
				for(var i = 0; i < jsfiles.length; i++) {

					logger.log('Inserting the following js library: ' + jsfiles[i], 7);
					lm.getLibraryContentsAsString(jsfiles[i], function(result, found) {
						logger.log('Found ' + jsfiles[i] + '? ' + found, 7);
						//logger.log('File contents: ' + result, 7);
						if(found) {
							jsPageText += result + '\n';
							//logger.log('jsPageText so far: ' + jsPageText, 7);
						}
					});

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

			cssincludes = (styleStart + '/css/' + view + '-' + title + '.css' + styleEnd);
			lastPartOfPage = cssincludes + lastPartOfPage;

			if(cssfiles.length === 0) {
				cb(null, null);
			}
			else {
				for(var i = 0; i < cssfiles.length; i++) {
					logger.log('Inserting the following css library: ' + cssfiles[i], 7);
					lm.getLibraryContentsAsString(cssfiles[i], function(result, found) {
						logger.log('Found ' + cssfiles[i] + '? ' + found, 7);
						//logger.log('File contents: ' + result, 7);
						if(found) {
							cssPageText += result + '\n';
							//logger.log('jsPageText so far: ' + jsPageText, 7);
						}
					});

					if(i == cssfiles.length-1) {
						cb(null, null);
					}
				}
			}
		}
	], 
	function(err, results) {
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
			}
		});

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
			}
		});

		callback(firstPartOfPage + lastPartOfPage);
	});
}


// Accepts a response object and parses a view into it
DeployManager.prototype.deploy = function(view) {

if(!view) {
	throw Error('No view specified!');
}

// Set up search
searchDirectories.push('./custom');
searchDirectories.push(settings.path_to_nirodha + 'libs');
searchDirectories.push('custom/static');

/*
*	Parse the libraries included in the thtml
*/

// Start by searching the custom directories
async.series([
	function(callback) {
		var files = [];
		walkSync(searchDirectories[0], function(dir, directories, fileNames) {
			files.push({ "fileNames": fileNames, "dir": dir});
			//logger.log('Loading file ' + one + '/' + three, 7);
		});
		callback(null, files);
	},
	function(callback) {
		var files = [];
		walkSync(searchDirectories[1], function(dir, directories, fileNames) {
			files.push({ "fileNames": fileNames, "dir": dir});
			//logger.log('Loading file ' + one + '/' + three, 7);
		});
		callback(null, files);
	}
	],
	function(err, libraries) {
		var jsFiles = "";
		var cssFiles = "";

		var findJsFiles = function(resultFileList) {
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
		};

		var findCSSFiles = function(resultFileList) {
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
		};

		jsFiles = findJsFiles(libraries[0]);
		jsFiles += ',' + findJsFiles(libraries[1]);
		logger.log('JS files is : ' + jsFiles, 7);
		jsFiles = jsFiles.split(',');

		cssFiles = findCSSFiles(libraries[0]);
		cssFiles += ',' + findCSSFiles(libraries[1]);
		logger.log('CSS files is : ' + cssFiles, 7);
		cssFiles = cssFiles.split(',');

		logger.log('Found the following list of JS files in Nirodha paths: ' + JSON.stringify(jsFiles), 5);
		logger.log('Found the following list of CSS files in Nirodha paths: ' + JSON.stringify(cssFiles), 5);

		logger.log('Library manager init...');
		lm.init(libraries, jsFiles, cssFiles);

		// Get the page text for the view by removing the .html portion of the request and parsing the view
		var pageText = fs.readFileSync(view + '.html').toString();
		// var jsPageText = '';
		// var cssPageText = '';

		// TODO: Fix this includes
		var includes = JSON.parse(fs.readFileSync(view + '.json').toString());

		var addToPageText = function(finalText) {
			pageText = finalText;
		};

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
					for(var i = 0; i < includes.length; i++) {
						logger.log('index: ' + i);
						generateJsAndCSSForIncludeSection(pageText, includes[i], view, addToPageText);
					}
					cb(null, null);
				},
				// Add in the templates
				function(cb) {
					logger.log('view is : ' + view);
					var template_filename = './custom/templates/' + view + '_templates.html';
					logger.log('Adding the templates html to the core html file...');
					logger.log('Loading the following file: ' + template_filename);
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
						logger.log('Directory: ' + dir, 7);
						logger.log('FileNames: ' + JSON.stringify(fileNames), 7);

						for(var i = 0; i < fileNames.length; i++) {
							var writeDir;
							if(err) {
								logger.log(err, 3);
							}
							if(dir === 'custom/static') {
								writeDir = 'deploy/';
							}
							else {
								logger.log('Directory to write to: ' + dir.substring(searchDirectories[2].length, dir.length), 6);
								writeDir =  'deploy' + dir.substring(searchDirectories[2].length, dir.length) + '/';
								var folderExists = fs.existsSync(writeDir);
								if(!folderExists) {
									fs.mkdirSync(writeDir);
								}
							}
							logger.log(writeDir + fileNames[i], 6);
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
				logger.log('Writing final html file...');
				fs.writeFileSync('./deploy/' + view + '.html', pageText);
		});
	});
};
