var fs = require('fs');
var path = require('path');

/**
 * Expose the root.
 */

exports = module.exports = new Util;

/**
 * Expose `ViewManager`.
 */

exports.Util = Util;

function Util() {

}

// Method to get all files in directories
Util.prototype.walkSync = function (start, callback) {
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
};

// Filters
Util.prototype.isHtmlFile = function(element) {
	//logger.log(element + ', Is this a HTML file? ' + (element.indexOf('.html') > 0));
	return element.indexOf('.html') > 0;
}

Util.prototype.isJsFile = function(element) {
	//logger.log(element + ', Is this a JS file? ' + (element.indexOf('.js') > 0));
	return element.indexOf('.js') > 0;
}

Util.prototype.isCssFile = function(element) {
	//logger.log(element + ', Is this a CSS file? ' + (element.indexOf('.css') > 0));
	return element.indexOf('.css') > 0;
}
