var fs = require('fs');
var logger = require('jslogging');
var async = require('async');
var compressor = require('node-minify');

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

// Constants
var TEMPLATE_KEY = '{templates}';

exports = module.exports = new View();

/**
 * Expose `nirodhaManager`.
 */

exports.View = View;

function View() {
}

View.prototype.init = function(viewname) {
    this.name = viewname;
    logger.debug('Did all the right stuff exist?' + (fs.existsSync(viewname + '.json') && fs.existsSync(viewname + '.html')));
    if(fs.existsSync(viewname + '.json') && fs.existsSync(viewname + '.html')) {
        this.includes = JSON.parse(fs.readFileSync(viewname + '.json', 'utf-8'));
        this.pageText = fs.readFileSync(viewname + '.html', 'utf-8');
    }
    
};

View.prototype.create = function(callback) {
    var viewname = this.name;
    if(typeof(this.name) === 'undefined' || this.name === '') {
        throw new Error('No view name, did you call view.init with a name?');
    }
    var nirodhaPath = utils.getNirodhaPath();
    async.series({
        createDefaultView: function(cb) {
            utils.copyFile(nirodhaPath + 'tmpl/defaultView.html', viewname + '.html', function(err) {
                if(err) {
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
            if(typeof(callback) !== 'undefined') {
                callback(null, testing.view.viewcreated);                
            }
        }
    });
};

/**
 *  These are all for deploying the view
 */

function getLibraries(cwd, type, include, callback) {
    
    process.chdir(cwd);
    logger.debug('Entering loop to add ' + type + ' libraries');
    var files = include.libs[type];
    var text = '';
    logger.debug('JS Library lengths: ' + files.length);

    if(files.length === 0) {
        callback(null, '');
    }
    else {
        
        for(var i = 0; i < files.length; i++) {

            logger.debug('Inserting the following ' + type + ' library: ' + files[i]);
            text = text + lm.getLibraryContentsSync(files[i]) + '\n';
            logger.debug('Text is ' + text);
            if(i === files.length-1) {
                logger.debug('Got into the end...' + text);
                callback(null, text);
            }
        }
    }
}

View.prototype.getLibraries = function(cwd, type, include, callback) {
    return getLibraries(cwd, type, include, callback);
};

View.prototype.deploy = function(minify, callback) {
    var viewHandle = this;
    async.series({
        GenerateJS: function(cb) {
            viewHandle.generateJavascript(minify, cb);
        },
        GenerateCSS: function(cb) {
            viewHandle.generateCSS(minify, cb);
        },
        GenerateHTML: function(cb) {
            viewHandle.renderForDeploy(cb);
        },
        CopyStaticFiles: function(cb) {
            viewHandle.copyStaticFiles(cb);
        }
    }, function(err, result) {
        callback(err, result);
    });
};

View.prototype.generateSupportFilesForDeploy = function(type, minify, callback) {
    
    var viewHandle = this;
    if(typeof(this.includes) === 'undefined') {
        throw new Error('Includes was undefined');
    }
    var includes = this.includes;
    async.series({
        BuildText: function(cb) {
            var getLibraryCallback = function(err, text) {
                var finalText = '';
                if(err) {
                    logger.warn(err);
                }
                logger.debug('Text is ' + text);
                finalText += text;
                // Minify the files
                logger.debug('Current working directory is ' + process.cwd());
                fs.writeFileSync('./deploy/' + type + '/' + viewHandle.name + '-' + includeTitle + '.' + type + '.temp', finalText);
                if(cnt === includes.length-1) {
                    logger.debug('Writing as finalText: ' + finalText);
                    cb();
                }
            };

            for(var cnt = 0; cnt < includes.length; cnt++) {
                var include = includes[cnt];
                // Make fs friendly title
                var includeTitle = include.title.substring(1, include.title.length-1);
                logger.debug('Setting title to ' + includeTitle);
                viewHandle.getLibraries(process.cwd(), type, include, getLibraryCallback);
            }
        },
        MinifyFile: function(cb) {
            var include;
            var includeTitle;

            var inPath;
            var outPath;
            if(minify) {
                var minifier;
                if(type === 'js') {
                    minifier = 'gcc';
                }
                else if(type === 'css') {
                    minifier = 'yui-css';
                }

                for(var i = 0; i < includes.length; i++) {
                    include = includes[i];
                    includeTitle = include.title.substring(1, include.title.length-1);

                    inPath = './deploy/' + type + '/' + viewHandle.name + '-' + includeTitle + '.' + type + '.temp';
                    outPath = './deploy/' + type + '/' + viewHandle.name + '-' + includeTitle + '.' + type;

                    try {
                        new compressor.minify({
                            type: minifier,
                            fileIn: inPath,
                            fileOut: outPath
                        });
                    }
                    catch (e) {
                        logger.warn('Error occured in minification: ' + e);
                    }
                }
            }
            else {
                for(var k = 0; k < includes.length; k++) {
                    include = includes[k];
                    includeTitle = include.title.substring(1, include.title.length-1);

                    inPath = './deploy/' + type + '/' + viewHandle.name + '-' + includeTitle + '.' + type + '.temp';
                    outPath = './deploy/' + type + '/' + viewHandle.name + '-' + includeTitle + '.' + type;

                    fs.writeFileSync(outPath, fs.readFileSync(inPath), 'utf-8');
                    fs.unlinkSync(inPath);
                }
            }

            cb(null, 'Minification Complete');
        }
    }, function(err, result) {
        callback(err, result);
    });
};

View.prototype.generateJavascript = function(minify, callback) {
    this.generateSupportFilesForDeploy('js', minify, callback);
};

View.prototype.generateCSS = function(minify, callback) {
    this.generateSupportFilesForDeploy('css', minify, callback);
};

function addInTemplates(pageText, templates) {
    var start = pageText.indexOf(TEMPLATE_KEY);
    var end  = pageText.indexOf(TEMPLATE_KEY) + TEMPLATE_KEY.length;
    var firstpart = pageText.substring(0, start);
    var lastpart = pageText.substring(end, pageText.length);
    // logger.log('template text: ' + template_text);
    return(firstpart + templates + lastpart); 
}

View.prototype.renderForDeploy = function(callback) {
    var includes = this.includes;
    var pageText = this.pageText;

    logger.debug('view is : ' + this.name);
    var template_filename = './custom/templates/' + this.name + '_templates.html';
    logger.debug('Adding the templates html to the core html file...');
    logger.debug('Loading the following file: ' + template_filename);
    var template_text = fs.readFileSync(template_filename).toString();

    pageText = addInTemplates(pageText, template_text);

    logger.debug('Writing final html file...');
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
    callback(null, 'HTML Successfully written');
};

View.prototype.copyStaticFiles = function(callback) {
    var staticDirectory = 'custom/static';
    utils.walkSync(staticDirectory, function(dir, directories, fileNames) {
        logger.debug('Directory: ' + dir);
        logger.debug('FileNames: ' + JSON.stringify(fileNames));
        if(typeof(fileNames) !== 'undefined') {
            for(var i = 0; i < fileNames.length; i++) {
                var writeDir;
                if(dir === staticDirectory) {
                    writeDir = 'deploy/';
                }
                else {
                    logger.log('Directory to write to: ' + dir.substring(staticDirectory.length, dir.length), 7);
                    writeDir =  'deploy' + dir.substring(staticDirectory.length, dir.length) + '/';
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
        }
        //logger.log('Loading file ' + one + '/' + three, 7);
        callback(null, 'Static files written');
    });
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
        return;
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
}

View.prototype.getIncludes = function() {
    return JSON.parse(JSON.stringify(this.includes));
};

View.prototype.generateIncludesAsHTMLInserts = function() {
    var results = [];

    if(typeof(this.includes) === 'undefined') {
        throw new Error('Did you run lm init?');
    }

    for(var i = 0; i < this.includes.length; i++) {
        var libobject = {};
        var currentInclude = this.includes[i]; 
        libobject.title = {};
        logger.debug('Current Includes: ' + JSON.stringify(this.includes));
        libobject.css = generateIncludes(currentInclude, 'css');
        libobject.js = generateIncludes(currentInclude, 'js');
        results.push(libobject);
    }

    return results;
};

View.prototype.render = function() {
    var includes = this.generateIncludesAsHTMLInserts();
    var pageText = this.pageText;

    logger.debug('view is : ' + this.name);
    var template_filename = './custom/templates/' + this.name + '_templates.html';
    logger.debug('Adding the templates html to the core html file...');
    logger.debug('Loading the following file: ' + template_filename);
    var template_text = fs.readFileSync(template_filename).toString();

    var start = pageText.indexOf(TEMPLATE_KEY);
    var end  = pageText.indexOf(TEMPLATE_KEY) + TEMPLATE_KEY.length;
    var firstpart = pageText.substring(0, start);
    var lastpart = pageText.substring(end, pageText.length);
    // logger.log('template text: ' + template_text);
    pageText = firstpart + template_text + lastpart; 
    logger.debug('Pagetext is ' + pageText);
    logger.debug('Writing final html file...');

    for(var i = 0; i < includes.length; i++) {
        var libobject = includes[i];

        start = pageText.indexOf(libobject.title);
        end = start + libobject.title.length;
        firstpart = pageText.substring(0, start);
        lastpart = pageText.substring(end, pageText.length);

        pageText = firstpart + libobject.js + libobject.css + lastpart;
    }
    return pageText;
};