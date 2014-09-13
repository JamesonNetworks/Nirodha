var logger = require('jslogging');
var fs = require('fs');
var path = require('path');
var watch = require('watch');

var deploying = false;

module.exports = function (args, settings) {

    var deploy = function() {
        if(deploying) {
            setTimeout(deploy, 500, settings, args[0]);
        }
        else {
            deploying = true;
            logger.info('Filesystem change, deploying...');
            logger.debug('Entering Deployment Routine...');
            logger.debug('Using arguments: ' + args);

            var nm = require('./nirodhaManager.js');
            nm.setSettings(settings);

            if(args.length != 1) {
                logger.info('Received more than 1 argument');
            }
            logger.info('Deploying the following views: ' + JSON.stringify(args[0]));

            // Create the folder with the structure
            nm.deploy(settings, args[0], function() {
                deploying = false;
            });
        }
    }

    watch.createMonitor('./',
        function (monitor) {
            monitor.on("created", function (f, stat) {
                logger.log('Created file ' + f);
                if(!(f.indexOf('deploy/') > -1)) {
                    deploy();
                }
            });
            monitor.on("changed", function (f, curr, prev) {
                logger.log('Changed file ' + f);
                if(!(f.indexOf('deploy/') > -1)) {
                    deploy();
                }
            })
            monitor.on("removed", function (f, stat) {
                logger.log('Removed file ' + f);
                if(!(f.indexOf('deploy/') > -1)) {
                    deploy();
                }
            })
        }
    );
};
