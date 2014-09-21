var logger = require('jslogging');
var watch = require('watch');

module.exports = function () {

    var wm = require('./watchManager.js');

    var callback = function() {
        logger.info('Finished deploying');
    };

    logger.info('Starting to watch current directory...');

    watch.createMonitor('./',
        function (monitor) {
            monitor.on("created", function (f) {
                logger.log('Created file ' + f);
                if(!(f.indexOf('deploy/') > -1)) {
                    wm.projectFileChangeEventHandler(f, callback);
                }
            });
            monitor.on("changed", function (f) {
                logger.log('Changed file ' + f);
                if(!(f.indexOf('deploy/') > -1)) {
                    wm.projectFileChangeEventHandler(f, callback);
                }
            });
            monitor.on("removed", function (f) {
                logger.log('Removed file ' + f);
                if(!(f.indexOf('deploy/') > -1)) {
                    wm.projectFileChangeEventHandler(f, callback);
                }
            });
        }
    );
};
