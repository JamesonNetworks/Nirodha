var logging = require('./logging.js');
var fs = require('fs');
var path = require('path');
var settings = require('../settings.json');

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

function createNirodhaView(viewname, optdirectory) {
	var dir;
	if(optdirectory) {
		dir = optdirectory;
		copyFile(settings.path_to_nirodha + 'tmpl/newproject.default.json', dir + 'info.json', function(err) {
		if(err) {
			logging('Problem copying default json information: ' + err, 0);
		}
		else {
			logging('Successfully created info.json');
		}
	});
	}
	else {
		dir = './';
	}
	// Copy in the default view
	copyFile(settings.path_to_nirodha + 'tmpl/defaultView.html', dir + viewname + '.html', function(err) {
		if(err) {
			logging('Problem copying default view: ' + err, 0);
		}
		else {
			logging('Successfully created ' + viewname + '.html');
		}
	});

	// Copy in the default javascript
	copyFile(settings.path_to_nirodha + 'tmpl/defaultView.js', dir + 'custom/js/' + viewname + '.js', function(err) {
		if(err) {
			logging('Problem copying default js: ' + err, 0);
		}
		else {
			logging('Successfully created ' + viewname + '.js');
		}
	});

	// Copy in the default css
	copyFile(settings.path_to_nirodha + 'tmpl/defaultView.css', dir + 'custom/css/' + viewname + '.css', function(err) {
		if(err) {
			logging('Problem copying default css: ' + err, 0);
		}
		else {
			logging('Successfully created ' + viewname + '.css');
		}
	});

	// Copy in the default json accessories
	copyFile(settings.path_to_nirodha + 'tmpl/defaultView.json', dir + viewname + '.json', function(err) {
		if(err) {
			logging('Problem copying default css: ' + err, 0);
		}
		else {
			logging('Successfully created ' + viewname + '.json');
		}
	});

	// Copy in the default view templates
	copyFile(settings.path_to_nirodha + 'tmpl/defaultView_templates.html', dir + 'custom/templates/' + viewname + '_templates.html', function(err) {
		if(err) {
			logging('Problem copying default view: ' + err, 0);
		}
		else {
			logging('Successfully created ' + viewname + '.html');
		}
	});
}

module.exports = function (args) {
	logging('Entering Creation Routine...', 6);
	logging('Using arguments: ' + args);

	if(args.length != 1) {
		logging('Received more than 1 argument, checking to see if this is to create a view');
		if(args[0] === 'view' && args.length == 2) {
			logging('Creating a view for ' + args[1]);
			createNirodhaView(args[1]);

		}
		else {
			logging('Received an unknown command, quitting');
		}
	}
	else {
		logging('Creating a project with the name ' + args + '...', 6);
		// Create the folder with the structure
		if(fs.existsSync(args)) {
			logging('Error creating directory, it already exists!', 0);
		}
		else {
			dirName = './' + args[0] + '/';
			logging('Creating directory: ' + dirName, 7);
			fs.mkdirSync(dirName);
			fs.mkdirSync(dirName + 'custom');
			fs.mkdirSync(dirName + 'custom/js');
			fs.mkdirSync(dirName + 'custom/css');
			fs.mkdirSync(dirName + 'custom/templates');
			fs.mkdirSync(dirName + 'deploy');
			fs.mkdirSync(dirName + 'deploy/js');
			fs.mkdirSync(dirName + 'deploy/css');
			fs.mkdirSync(dirName + 'custom/static');
			
			createNirodhaView('index', dirName);
		}
	}
}