var fs = require('fs');
var logging = require('./logging.js');
var async = require('async');
var utils = require('./utilities.js');
var settings = require('../settings.json');
var compressor = require('node-minify');

// Handle to library manager
var lm = require('./libraryManager.js');

var INCLUDES = new String('{includes}');
var TEMPLATES = new String('{templates}');
var scriptStart = '<script type="text/javascript" src="';
var scriptEnd = '"></script>\n';

var styleStart = '<link rel="stylesheet" href="';
var styleEnd = '">\n';

var view;
var searchDirectories = [];

/**
 * Expose the root.
 */

exports = module.exports = new DeployManager;

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
}

// Accepts a response object and parses a view into it
DeployManager.prototype.deploy = function(view) {

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
			//logging('Loading file ' + one + '/' + three, 7);
		});
		callback(null, files);
	},
	function(callback) {
		var files = [];
		walkSync(searchDirectories[1], function(dir, directories, fileNames) {
			files.push({ "fileNames": fileNames, "dir": dir});
			//logging('Loading file ' + one + '/' + three, 7);
		});
		callback(null, files);
	}
	],
	function(err, libraries) {
		var jsFiles = "";
		var cssFiles = "";

		var findJsFiles = function(resultFileList) {
			var returnableJsFiles = "";
			//logging('in findJsFiles: Result files list: ' + resultFileList[i], 7);
			for(var i = 0; i < resultFileList.length; i++) {
				//logging('in findJsFiles: Result files list: ' + JSON.stringify(resultFileList[i].fileNames), 7);
				//logging('in findJsFiles: Result files list: ' + JSON.stringify(resultFileList[i].fileNames.filter(isJsFile)), 7);
				if(resultFileList[i].fileNames.filter(isJsFile).length > 0) {
					//logging('Js files are : ' + resultFileList[i].fileNames.filter(isJsFile), 7);
					returnableJsFiles += resultFileList[i].fileNames.filter(isJsFile).toString() + ',';
				}
			}
			return returnableJsFiles;
		}

		var findCSSFiles = function(resultFileList) {
			var returnableJsFiles = "";
			//logging('in findJsFiles: Result files list: ' + resultFileList[i], 7);
			for(var i = 0; i < resultFileList.length; i++) {
				//logging('in findJsFiles: Result files list: ' + JSON.stringify(resultFileList[i].fileNames), 7);
				//logging('in findJsFiles: Result files list: ' + JSON.stringify(resultFileList[i].fileNames.filter(isJsFile)), 7);
				if(resultFileList[i].fileNames.filter(isCssFile).length > 0) {
					//logging('Js files are : ' + resultFileList[i].fileNames.filter(isJsFile), 7);
					returnableJsFiles += resultFileList[i].fileNames.filter(isCssFile).toString() + ',';
				}
			}
			return returnableJsFiles;
		}

		jsFiles = findJsFiles(libraries[0]);
		jsFiles += ',' + findJsFiles(libraries[1]);
		logging('JS files is : ' + jsFiles, 7);
		jsFiles = jsFiles.split(',');

		cssFiles = findCSSFiles(libraries[0]);
		cssFiles += ',' + findCSSFiles(libraries[1]);
		logging('CSS files is : ' + cssFiles, 7);
		cssFiles = cssFiles.split(',');

		console.log('Found the following list of JS files in Nirodha paths: ' + JSON.stringify(jsFiles));
		console.log('Found the following list of CSS files in Nirodha paths: ' + JSON.stringify(cssFiles));

		logging('Library manager init...');
		lm.init(libraries, jsFiles, cssFiles);

		// Get the page text for the view by removing the .html portion of the request and parsing the view
		var pageText = fs.readFileSync(view + '.html').toString();
		var jsPageText = '';
		var cssPageText = '';

		// TODO: Fix this includes
		var includes = JSON.parse(fs.readFileSync(view + '.json').toString());
		var jsfiles = includes.js;
		var cssfiles = includes.css;

		logging('Included js: ' + JSON.stringify(jsfiles));

		// Locate the include section for javascript/css
		var startOfIncludes = pageText.indexOf(INCLUDES);
		logging('Includes length: ' + INCLUDES.length, 7);
		var endOfIncludes = startOfIncludes + INCLUDES.length;

		logging('JS/CSS include start: ' + startOfIncludes, 7);
		logging('JS/CSS include end: ' + endOfIncludes, 7);
		var firstPartOfPage = pageText.substring(0, startOfIncludes);
		var lastPartOfPage = pageText.substring(endOfIncludes, pageText.length);

		async.series([
			// Insert js files
			function(cb) {
				logging('Entering loop to add js libraries', 7);
				logging('JS Library lengths: ' + jsfiles.length, 7);
				// Insert references to the new js library files
				var jsincludes = "";

				jsincludes = (scriptStart + '/js/' + view  + '-includes' + '.js' + scriptEnd);
				lastPartOfPage = jsincludes + lastPartOfPage;

				for(var i = 0; i < jsfiles.length; i++) {

					logging('Inserting the following js library: ' + jsfiles[i], 7)
					lm.getLibraryContentsAsString(jsfiles[i], function(result, found) {
						logging('Found ' + jsfiles[i] + '? ' + found, 7);
						//logging('File contents: ' + result, 7);
						if(found) {
							jsPageText += result + '\n';
							//logging('jsPageText so far: ' + jsPageText, 7);
						}
					});

					if(i == jsfiles.length-1) {
						cb(null, null);
					}
				}
			},
			//Insert css files
			function(cb) {
				logging('Entering loop to add css libraries', 7);
				logging('CSS Library length: ' + cssfiles.length, 7);
				// Insert references to the new css library files
				var cssincludes = "";

				cssincludes = (styleStart + '/css/' + view + '-includes' + '.css' + styleEnd);
				lastPartOfPage = cssincludes + lastPartOfPage;

				for(var i = 0; i < cssfiles.length; i++) {
					logging('Inserting the following css library: ' + cssfiles[i], 7);
					lm.getLibraryContentsAsString(cssfiles[i], function(result, found) {
						logging('Found ' + cssfiles[i] + '? ' + found, 7);
						//logging('File contents: ' + result, 7);
						if(found) {
							cssPageText += result + '\n';
							//logging('jsPageText so far: ' + jsPageText, 7);
						}
					});

					if(i == cssfiles.length-1) {
						cb(null, null);
					}
				}
			},
			//Insert template files
			function(cb) {
				var template_filename = './custom/templates/' + view + '_templates.html'
				logging('Adding the templates html to the core html file...', 7);
				logging('Loading the following file: ' + template_filename, 7);
				var template_text = fs.readFileSync(template_filename).toString();
				firstPartOfPage = firstPartOfPage + template_text;
				pageText = firstPartOfPage + lastPartOfPage;
				cb(null, null);
			},
			//Copy static files
			function(cb) {
				walkSync(searchDirectories[2], function(dir, directories, fileNames) {
					logging('Directory: ' + dir, 7);
					logging('FileNames: ' + JSON.stringify(fileNames), 7);

					for(var i = 0; i < fileNames.length; i++) {
						var writeDir;
						if(err) {
							logging(err, 3);
						}
						if(dir === 'custom/static') {
							writeDir = 'deploy/'
						}
						else {
							logging('Directory to write to: ' + dir.substring(searchDirectories[2].length, dir.length), 6);
							writeDir =  'deploy' + dir.substring(searchDirectories[2].length, dir.length) + '/';
							var folderExists = fs.existsSync(writeDir);
							if(!folderExists) {
								fs.mkdirSync(writeDir);
							}
						}
						logging(writeDir + fileNames[i], 6);
						logging('FileName: ' + JSON.stringify(fileNames[i]), 7);
						var data = fs.readFileSync(dir + '/' + fileNames[i]);
						fs.writeFileSync(writeDir + fileNames[i], data);
					}
					//logging('Loading file ' + one + '/' + three, 7);
				});
				cb(null, null);
			}
		], 
		function(err, results) {
			logging('html contents:' + pageText, 7);
			logging('Javascript contents: ' + jsPageText, 7);
			logging('CSS contents: ' + cssPageText, 7);
			
			fs.writeFileSync('./deploy/' + view + '.html', pageText);
			fs.writeFileSync('./deploy/js/' + view + '-includes.js.temp', jsPageText);
			fs.writeFileSync('./deploy/css/' + view + '-includes.css.temp', cssPageText);

			new compressor.minify({
			    type: 'gcc',
			    fileIn: './deploy/js/' + view + '-includes.js.temp',
			    fileOut: './deploy/js/' + view + '-includes.js',
			    callback: function(err, min){
			    	if(err) {
			    		logging('Calling error for minifying ' + './deploy/js/' + view + '-includes.js.temp', 3);
			    		logging(err, 3);
			    	}
			    	fs.unlinkSync('./deploy/js/' + view + '-includes.js.temp');
			    }
			});

			new compressor.minify({
			    type: 'yui-css',
			    fileIn: './deploy/css/' + view + '-includes.css.temp',
			    fileOut: './deploy/css/' + view + '-includes.css',
			    callback: function(err, min){
			    	if(err) {
			    		logging('Calling error for minifying ' + './deploy/css/' + view + '-includes.css.temp', 3);
			    		logging(JSON.stringify(err), 3);
			    	}
			    	fs.unlinkSync('./deploy/css/' + view + '-includes.css.temp');
			    }
			});

		});
	});
}