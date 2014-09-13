var fs = require('fs');
var path = require('path');

/**
 * Expose the root.
 */

exports = module.exports = new Util();

/**
 * Expose `Util`.
 */

exports.Util = Util;

function Util() {

}

function walkSync (start, callback) {
  var stat = fs.statSync(start);

  if (stat.isDirectory()) {
    var filenames = fs.readdirSync(start);

    var coll = filenames.reduce(function (acc, name) {
      var abspath = path.join(start, name);

      if (fs.statSync(abspath).isDirectory()) {
        acc.dirs.push(name);
      } else {
        acc.names.push(name);
      }

      return acc;
    }, {"names": [], "dirs": []});

    callback(start, coll.dirs, coll.names);

    coll.dirs.forEach(function (d) {
      var abspath = path.join(start, d);
      Util.prototype.walkSync(abspath, callback);
    });

  } else {
    throw new Error("path: " + start + " is not a directory");
  }
}

// Method to get all files in directories
Util.prototype.walkSync = function (start, callback) {
  walkSync(start, callback);
};

// Filters
Util.prototype.isHtmlFile = function(element) {
	//logger.log(element + ', Is this a HTML file? ' + (element.indexOf('.html') > 0));
	return element.indexOf('.html') > 0;
};

Util.prototype.isJsFile = function(element) {
	//logger.log(element + ', Is this a JS file? ' + (element.indexOf('.js') > 0));
	return element.indexOf('.js') > 0;
};

Util.prototype.isCssFile = function(element) {
	//logger.log(element + ', Is this a CSS file? ' + (element.indexOf('.css') > 0));
	return element.indexOf('.css') > 0;
};

Util.prototype.getSearchDirectories = function(nirodhaPath) {
  var directories = [];

    // Set up search
  directories.push('./custom');
  directories.push(nirodhaPath + 'libs');
  directories.push('custom/static');

  return directories;
};

// This is a weird looking one, I apologize. It's getting passed
// into async as a series of functions to be executed, it has to
// happen in two places, so I pulled it out and threw it here. 
// Probably pretty awful to see it without context.
Util.prototype.deriveLibraries = function(searchDirectories) {
  return [
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
  ];
};