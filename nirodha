#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander');

function list(val) {
  return val.split(',').map(Number);
}

program
  .version('0.0.1')
  .option('-c, --create', 'Create a new Nirodha project')
  .option('-g, --generate', 'Generate a new view inside of a Nirodha project')
  .option('-s, --start', 'Start hosting the Nirodha project')
  .option('-d, --deploy', 'Compile the Nirodha project to the deploy folder');

// must be before .parse() since
// node's emit() is immediate

program.on('--help', function(){
  console.log('  Examples:');
  console.log('');
  console.log('    $ custom-help --help');
  console.log('    $ custom-help -h');
  console.log('');
});

program.parse(process.argv);

/*  Nirodha Source Code
 *  Author: Brent Jameson
 *  Date: Oct 24 2013
 */

// Temp hack to not accept two arguments
var argumentCount = 0;

if(program.create) {
  argumentCount++;
}

if(program.generate) {
  argumentCount++;
}

if(program.start) {
  argumentCount++;
}

if(program.deploy) {
  argumentCount++;
}

if(argumentCount != 1) {
  console.log("An incorrect number of arguments was specified: " + argumentCount + ", please try your command again with only one option");
}
else {
  if(program.create) {
  var create = require('./bin/create.js');
  create(program.args);
  }

  if(program.generate) {
    var generate = require('./bin/generate.js');
    generate(program.args);
  }

  if(program.start) {
    var start = require('./bin/start.js');
    start(program.args);
  }

  if(program.deploy) {
    var deploy = require('./bin/deploy.js');
    deploy(program.args);
  }
}