var fs = require('fs');
var logger = require('jslogging');
var async = require('async');
var compressor = require('node-minify');
var eventEmitter = require('events').EventEmitter;

var utils = require('./utilities.js');
var testing = require('../testing.json');
var lm = require('./libraryManager.js');

var script = {
    js : {
        start: '<script type="text/javascript" src="',
        end: '"></script>\n'
    },
    css: {
        start: '<link rel="stylesheet" href="',
        end: '">\n'
    }
};

exports = module.exports = new View();

/**
 * Expose `nirodhaManager`.
 */

exports.View = View;

function View() {
};

View.prototype.init = function(viewname) {
    this.name = viewname;
    logger.info('Did all the right stuff exist?' + (fs.existsSync(viewname + '.json') && fs.existsSync(viewname + '.html')));
    if(fs.existsSync(viewname + '.json') && fs.existsSync(viewname + '.html')) {
        this.includes = JSON.parse(fs.readFileSync(viewname + '.json', 'utf-8'));
        this.pageText = fs.readFileSync(viewname + '.html', 'utf-8');
    }
    
};

View.prototype.create = function(callback) {
    var viewname = this.name;
    if(typeof(this.name) === 'undefined') {
        throw new Error('No view name, did you call view.init with a name?');
    }
    var nirodhaPath = utils.getNirodhaPath();
    async.series({
        createDefaultView: function(cb) {
            utils.copyFile(nirodhaPath + 'tmpl/defaultView.html', viewname + '.html', function(err) {
                if(err) {
                    logger.warn('Problem copying default view: ' + err);
                    cb(err);
                }
                else {
                    logger.log('Successfully created ' + viewname + '.html');
                    cb(null, true);
                }
            });
        },
        createDefaultJavascript: function(cb) {
            utils.copyFile(nirodhaPath + 'tmpl/defaultView.js', 'custom/js/' + viewname + '.js', function(err) {
                if(err) {
                    logger.warn('Problem copying default js: ' + err);
                    cb(err);
                }
                else {
                    logger.log('Successfully created ' + viewname + '.js');
                    cb(null, true);
                }
            });
        },
        createDefaultCSS: function(cb) {
            utils.copyFile(nirodhaPath + 'tmpl/defaultView.css', 'custom/css/' + viewname + '.css', function(err) {
                if(err) {
                    logger.warn('Problem copying default css: ' + err);
                    cb(err);
                }
                else {
                    logger.log('Successfully created ' + viewname + '.css');
                    cb(null, true);
                }
            });
        },
        createDefaultJSON: function(cb) {
            // Copy in the default json accessories
            utils.copyFile(nirodhaPath + 'tmpl/defaultView.json', viewname + '.json', function(err) {
                if(err) {
                    logger.warn('Problem copying default JSON: ' + err);
                    cb(err);
                }
                else {
                    logger.log('Successfully created ' + viewname + '.json');
                    cb(null, true);
                }
            });
        },
        createDefaultTemplates: function(cb) {
            // Copy in the default json accessories
            utils.copyFile(nirodhaPath + 'tmpl/defaultView_templates.html', 'custom/templates/' + viewname + '_templates.html', function(err) {
                if(err) {
                    logger.warn('Problem copying default view: ' + err);
                    cb(err);
                }
                else {
                    logger.log('Successfully created ' + viewname + '_templates.html');
                    cb(null, true);
                }
            });
        }
    }, function(err, results) {
        if(err) {
            logger.warn('An error occured copying the default view files: ' + err + ' ' + JSON.stringify(results));
            logger.debug('dir: ' + process.cwd());
            logger.warn(JSON.stringify(err));
            callback(err);
        }
        else {
            this.includes = JSON.parse(fs.readFileSync(viewname + '.json', 'utf-8'));
            this.pageText = fs.readFileSync(viewname + '.html', 'utf-8');
            callback(null, testing.view.viewcreated);
        }
    });
};

/**
 *  These are all for deploying the view
 */

function getLibraries(cwd, type, include, callback) {
    process.chdir(cwd);
    logger.info('Entering loop to add ' + type + ' libraries');
    var files = include.libs[type];
    var text = '';
    logger.debug('JS Library lengths: ' + files.length);

    if(files.length === 0) {
        logger.info('Files length was zero');
        callback(null, null);
    }
    else {
        for(var i = 0; i < files.length; i++) {

            logger.info('Inserting the following ' + type + ' library: ' + files[i]);
            text += text + lm.getLibraryContentsSync(files[i]) + '\n';
            logger.info('Text is ' + text);
            if(i === files.length-1) {
                logger.debug('Got into the end...' + text);
                callback(null, text);
            }
        }
    }
}

View.prototype.getLibraries = function(cwd, type, include, callback) {
    return getLibraries(cwd, type, include, callback);
}

View.prototype.deploy = function(eventListener) {
    //debugger;
    var viewHandle = this;
    async.series({
        GenerateJS: function(cb) {
            viewHandle.generateJavascript(cb);
        },
        GenerateCSS: function(cb) {
            viewHandle.generateCSS(cb);
        },
        GenerateHTML: function(cb) {
            viewHandle.generateHTML(cb);
        },
    }, function(err, result) {
        if(err) {
            logger.warn('Error generating supporting files: ' + err);
        }
        eventListener.emit('done');
    });
};

View.prototype.generateSupportFilesForDeploy = function(type, callback) {
    var viewHandle = this;
    var includes = this.includes;
    async.series({
        BuildText: function(cb) {
            debugger;
            for(var cnt = 0; cnt < includes.length; cnt++) {
                var include = includes[cnt];
                // Make fs friendly title
                var includeTitle = include.title.substring(1, include.title.length-1);
                logger.info('Setting title to ' + includeTitle);
                viewHandle.getLibraries(process.cwd(), type, include, function(err, text) {
                    var finalText = '';
                    if(err) {
                        logger.warn(err);
                    }
                    logger.info('Text is ' + text);
                    finalText += text;
                    // Minify the files
                    logger.info('Current working directory is ' + process.cwd());
                    fs.writeFileSync('./deploy/' + type + '/' + viewHandle.name + '-' + includeTitle + '.' + type + '.temp', finalText);
                    if(cnt === includes.length-1) {
                        debugger;
                        logger.info('Writing as finalText: ' + finalText);
                        cb();
                    }
                });
            }
        },
        MinifyFile: function(cb) {
            debugger;
            var callback = function(err) {
                if(err) {
                    logger.warn(err);
                }
                if(i === includes.length-1) {
                    cb();
                }
            }
            var minifyEvents = new eventEmitter();
            var numberOfIncludes = includes.length;
            minifyEvents.on('done', function() {
                numberOfIncludes--;
                if(numberOfIncludes === 0) {
                    cb();
                }
            });
            for(var i = 0; i < includes.length; i++) {
                var include = includes[i];
                var includeTitle = include.title.substring(1, include.title.length-1);
                new compressor.minify({
                    type: 'gcc',
                    fileIn: './deploy/' + type + '/' + viewHandle.name + '-' + includeTitle + '.' + type + '.temp',
                    fileOut: './deploy/' + type + '/' + viewHandle.name + '-' + includeTitle + '.' + type,
                    callback: function(err) {
                        if(err) {
                            logger.warn(err);
                        }
                        minifyEvents.emit('done');
                    }
                });
            }
        }
    }, function(err, result) {            
        debugger;
        for(var i = 0; i < includes.length; i++) {
            var include = includes[i];
            var includeTitle = include.title.substring(1, include.title.length-1);
            fs.unlinkSync('./deploy/' + type + '/' + viewHandle.name + '-' + includeTitle + '.' + type + '.temp');
        }
        callback(err, result);
    });
}

View.prototype.generateJavascript = function(callback) {
    this.generateSupportFilesForDeploy('js', callback);
};

View.prototype.generateCSS = function(callback) {
    this.generateSupportFilesForDeploy('css', callback);
};

View.prototype.generateHTML = function(callback) {
    var includes = this.includes;
    var pageText = this.pageText;
    logger.info('Writing final html file...');
    for(var i = 0; i < includes.length; i++) {
        var libobject = includes[i];
        var title = libobject.title.substring(1, libobject.title.length-1);
        var firstPartOfPage = pageText.substring(0, pageText.indexOf(libobject.title));
        var lastPartOfPage = pageText.substring(pageText.indexOf(libobject.title) + libobject.title.length, pageText.length);
        var jsincludes = (script.js.start + '/js/' + this.name  + '-' + title + '.js' + script.js.end);
        var cssincludes = (script.css.start + '/css/' + this.name + '-' + title + '.css' + script.css.end);
        pageText = firstPartOfPage + jsincludes + cssincludes + lastPartOfPage;
    }

    fs.writeFileSync('./deploy/' + this.name + '.html', pageText);
    callback();
};

/**
 *  These are all for serving the view
 */
function generateIncludes(libobject, type) {
    var files = libobject.libs[type];

    logger.log('Generating includes...', 7);
    logger.log('Library lengths: ' + files.length, 7);

    // Insert references to the new js library files
    var includes = "";
    if(files.length === 0) {
        callback();
    }
    else {
        for(var i = 0; i < files.length; i++) {
            logger.log('Inserting the following ' + type + ' library: ' + files[i], 7);
            includes += (script[type].start + files[i] + script[type].end);

            if(i === files.length-1) {
                return includes;
            }
        }
    }
};

View.prototype.getIncludes = function() {
    return JSON.parse(JSON.stringify(this.includes));
};

View.prototype.generateIncludesAsHTMLInserts = function() {
    results = [];

    if(typeof(this.includes) === 'undefined') {
        throw new Error('Did you run lm init?');
    }

    for(var i = 0; i < this.includes.length; i++) {
        var libobject = {};
        var title = this.includes[i].title
        currentInclude = this.includes[i]; 
        libobject.title = {};
        logger.info('Current Includes: ' + JSON.stringify(this.includes));
        libobject.css = generateIncludes(currentInclude, 'css');
        libobject.js = generateIncludes(currentInclude, 'js');
        results.push(libobject);
    }

    return results;
};

View.prototype.generateHTMLForServing = function() {
    var includes = this.generateIncludesAsHTMLInserts();
    var pageText = this.pageText;
    for(var i = 0; i < includes.length; i++) {
        var libobject = includes[i];

        var start = pageText.indexOf(libobject.title);
        var end = start + libobject.title.length;
        var firstpart = pageText.substring(0, start);
        var lastpart = pageText.substring(end, pageText.length);

        pageText = firstpart + libobject.js + libobject.css + lastpart;
    }
    return pageText;
};