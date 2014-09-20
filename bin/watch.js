var logger = require('jslogging');
var fs = require('fs');
var path = require('path');
var watch = require('watch');
var utils = require('./utilities.js');

var deploying = false;

module.exports = function (args, settings) {

    var wm = require('./watchManager.js');

    watch.createMonitor('./',
        function (monitor) {
            monitor.on("created", function (f, stat) {
                logger.log('Created file ' + f);
                if(!(f.indexOf('deploy/') > -1)) {
                    wm.projectFileChangeEventHandler(f, callback);
                }
            });
            monitor.on("changed", function (f, curr, prev) {
                logger.log('Changed file ' + f);
                if(!(f.indexOf('deploy/') > -1)) {
                    wm.projectFileChangeEventHandler(f, callback);
                }
            })
            monitor.on("removed", function (f, stat) {
                logger.log('Removed file ' + f);
                if(!(f.indexOf('deploy/') > -1)) {
                    wm.projectFileChangeEventHandler(f, callback);
                }
            })
        }
    );
};
