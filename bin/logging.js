// Logging modile, logs based on levels 1-7
/*
Emergency (level 0)
The highest priority, usually reserved for catastrophic failures and reboot notices.

Alert (level 1)
A serious failure in a key system.

Critical (level 2)
A failure in a key system.

Error (level 3)
Something has failed.

Warning (level 4)
Something is amiss and might fail if not corrected.

Notice (level 5)
Things of moderate interest to the user or administrator.

Info (level 6)
The lowest priority that you would normally log, and purely informational in nature.

Debug (level 7)
The lowest priority, and normally not logged except for messages from the kernel.
*/
var colors = require('colors');
try {
	var settings = require('../settings.json');
}
catch(err) {
	console.log('Error occured in log init, is there a settings.json file?');
}
var currentLevel = 6;
/**
 * Expose the root.
 */

exports = module.exports = new logger();

/**
 * Expose `LibraryManager`.
 */

exports.logger = logger;

function logger() {
	if(typeof settings !== 'undefined') {
		currentLevel = Number(settings.log_level);
	}
}

logger.prototype.setLogLevel = function(level) {
	currentLevel = level;
};

logger.prototype.getLogLevel = function() {
	return currentLevel;
};

logger.prototype.log = function(statement, level) {
	if(level === null) {
		// Default the log level to info
		level = 6;
	}
	// Check to make sure we need to log something
	if(level <= currentLevel) {
		var logStatement = "";
		switch(level) {
			case 0:
				logStatement += "[ 0, EMR ] : ";
				logStatement += statement;
				console.log(logStatement.red);
			break;
			case 1:
				logStatement += "[ 1, ALT ] : ";
				logStatement += statement;
				console.log(logStatement.red);
			break;
			case 2:
				logStatement += "[ 2, CRT ] : ";
				logStatement += statement;
				console.log(logStatement.red);
			break;
			case 3:
				logStatement += "[ 3, ERR ] : ";
				logStatement += statement;
				console.log(logStatement.red);
			break;
			case 4:
				logStatement += "[ 4, WRN ] : ";
				logStatement += statement;
				console.log(logStatement.yellow);
			break;
			case 5:
				logStatement += "[ 5, NTC ] : ";
				logStatement += statement;
				console.log(logStatement);
			break;
			case 6:
				logStatement += "[ 6, INF ] : ";
				logStatement += statement;
				console.log(logStatement.green);
			break;
			case 7:
				logStatement += "[ 7, DBG ] : ";
				logStatement += statement;
				console.log(logStatement.cyan);
			break;
			default:
				throw new Error("Invalid log level submitted! Level: " + level + ", Statement: " + statement);
		}
	}
};
