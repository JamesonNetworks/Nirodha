var logger = require('jslogging');
var fs = require('fs');
var view = require('./view.js');

exports = module.exports = new Project();

/**
 * Expose `nirodhaManager`.
 */

exports.Project = Project;

function Project(projectname) {
};

Project.prototype.init = function(projectname) {
    this.name = projectname;
};

Project.prototype.create = function(callback) {
    var directoryName = this.name + '/';
    logger.log('Creating directory: ' + directoryName, 7);
    fs.mkdirSync(directoryName);
    fs.mkdirSync(directoryName + 'custom');
    fs.mkdirSync(directoryName + 'custom/js');
    fs.mkdirSync(directoryName + 'custom/css');
    fs.mkdirSync(directoryName + 'custom/templates');
    fs.mkdirSync(directoryName + 'deploy');
    fs.mkdirSync(directoryName + 'deploy/js');
    fs.mkdirSync(directoryName + 'deploy/css');
    fs.mkdirSync(directoryName + 'custom/static');

    process.chdir(directoryName);

    view.init('index');
    view.create(callback);
};