var logger = require('jslogging'),
    fs = require('fs'),
    async = require('async'),
    url = require('url'),
    path = require('path');

var lm = require('./libraryManager.js');
var testing = require('../testing.json');

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

var localView;
var directory;

exports = module.exports = new Server();

/**
 * Expose `nirodhaManager`.
 */

exports.server = Server;

function Server() {
    
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

function parse(res, directory, view, callback) {
    /*
    *   Parse the libraries included in the thtml
    */
    logger.debug('Directory: ' + directory);
    logger.debug('View: ' + view);
    if(typeof(directory) === 'undefined') {
        directory = this.directory;
    }
    if(typeof(view) === 'undefined') {
        view = this.localView;
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
                    if(i === jsfiles.length-1) {
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
                    if(i === cssfiles.length-1) {
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

// Accepts a response object and parses a view into it
Server.prototype.parse = function(res) {
    parse(res);
};

Server.prototype.handleRequest = function(req, res, done) {
    logger.debug('HTML Files: ' + this.htmlFiles);
    handleRequest(req, res, this.rootDirectory, this.htmlFiles, done);
};

Server.prototype.setRootDirectory = function(rtDir) {
    this.rootDirectory = rtDir;
};

Server.prototype.setHtmlFiles = function(htFiles) {
    this.htmlFiles = htFiles;
    logger.debug('HTML Files: ' + this.htmlFiles);
};

Server.prototype.setSettings = function(settings) {
    this.settings = settings;
};

Server.prototype.init = function(pView, pDirectory) {
    directory = pDirectory;
    localView = pView;
};