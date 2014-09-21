var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var logger = require('jslogging');

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
  if(fs.existsSync(start)) {
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
  else {
    callback('','');
  }
}

// Some ugly hacks here
function fileNameFilter(filename) {
  return (
    filename !== '.DS_Store' && 
    filename !== '.gitignore' && 
    filename.indexOf('.') !== -1 && 
    filename !== 'demo.css' &&
    filename !== 'jquery.fileupload-ui.css'
  );
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
	return isJsFile(element);
};

Util.prototype.isCssFile = function(element) {
	//logger.log(element + ', Is this a CSS file? ' + (element.indexOf('.css') > 0));
	return isCssFile(element);
};

function isJsFile(element) {
  //logger.log(element + ', Is this a JS file? ' + (element.indexOf('.js') > 0));
  return element.indexOf('.js') > 0;
}

function isCssFile(element) {
  //logger.log(element + ', Is this a CSS file? ' + (element.indexOf('.css') > 0));
  return element.indexOf('.css') > 0;
}


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
        files.push({ "fileNames": _.filter(fileNames, fileNameFilter), "dir": dir});
        //logger.log('Loading file ' + one + '/' + three, 7);
      });
      callback(null, files);
    }
  ];
};

// Returns a boolean, looks for duplicate names of JS and CSS files
Util.prototype.hasDuplicateLibraries = function(libraries) {
  logger.debug('Libraries is: ' + JSON.stringify(libraries));
  var librariesByName = [];
  for(var i = 0; i < libraries.length; i++) {
    for(var k = 0; k < libraries[i].length; k++) {
      logger.debug('Libraries in loop: ' + JSON.stringify(libraries[i][k].fileNames));
      if(typeof(libraries[i][k].fileNames) !== 'undefined') {
        librariesByName = librariesByName.concat(_.flatten(libraries[i][k].fileNames));        
      }
    }
  }
  logger.debug('Libraries count:');
  logger.debug(JSON.stringify(librariesByName.length));
  logger.debug('Unique Libraries count:');
  logger.debug(JSON.stringify(_.uniq(librariesByName).length));
  logger.debug('Are they the same? ' + _.uniq(librariesByName).length === librariesByName.length);
  // If the libraries by name have no length, we can skip this, def no duplicates
  return librariesByName.length > 0 ? (_.uniq(librariesByName).length !== librariesByName.length) : false;
};

// Returns a list of duplicate libraries
Util.prototype.getDuplicateLibraries = function(libraries) {
  var librariesByName = [];
  for(var i = 0; i < libraries.length; i++) {
    for(var k = 0; k < libraries[i].length; k++) {
      logger.debug('Libraries in loop: ' + JSON.stringify(libraries[i][k].fileNames));
      librariesByName = librariesByName.concat(libraries[i][k].fileNames);
    }
  }

  var duplicates = [];

  while(librariesByName.length > 0) {
    var library = librariesByName.pop();
    logger.debug('Checking for duplicate library: ' + JSON.stringify(library));
    if(_.contains(librariesByName, library)) {
      logger.debug('Found duplicate, pushing ' + library);
      duplicates.push(library);
    }
  }

  return duplicates;
};

Util.prototype.getNirodhaPath = function () {
  return path.join(path.dirname(fs.realpathSync(__filename)), '../');
};

Util.prototype.getViewFromFileName = function (filename) {
  // Determine if we are dealing with a templates file
  if(filename.indexOf('_templates') > 0) {
    var tempName = filename.substring(0, filename.indexOf('_templates')).split('/');
    return tempName[tempName.length-1];
  }
  else if(filename.indexOf('.html') > 0 || filename.indexOf('.js') > 0 || filename.indexOf('.css') > 0) {
    var tempName = filename.split('.')[0].split('/');
    return tempName[tempName.length-1];
  }
  else {
    return undefined;
  }
};

Util.prototype.copyFile = function(source, target, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function() {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
};

function findFiles(resultFileList, filter) {
  var returnableFiles = "";
  for(var i = 0; i < resultFileList.length; i++) {
    if(typeof(resultFileList[i].fileNames) !== 'undefined') {
      if(resultFileList[i].fileNames.filter(filter).length > 0) {
        returnableFiles += resultFileList[i].fileNames.filter(filter).toString() + ',';
      }  
    }
  }
  return returnableFiles; 
}

Util.prototype.findCSSFiles = function(resultFileList) {
  return findFiles(resultFileList, isCssFile);
};

Util.prototype.findJsFiles = function(resultFileList) {
  return findFiles(resultFileList, isJsFile);
};