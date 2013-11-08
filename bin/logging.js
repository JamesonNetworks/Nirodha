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

var currentLevel = 7;

module.exports = function(statement, level) {
	if(level == null) {
		// Default the log level to info
		level = 6;
	}
	// Check to make sure we need to log something
	if(level <= currentLevel) {
		var logStatement = "";
		switch(level) {
			case 0:
				logStatement += "0, EMR: ";
				logStatement += statement;
				console.log(logStatement);
			break;
			case 1:
				logStatement += "1, ALT: ";
				logStatement += statement;
				console.log(logStatement);
			break;
			case 2:
				logStatement += "2, CRT: ";
				logStatement += statement;
				console.log(logStatement);
			break;
			case 3:
				logStatement += "3, ERR: ";
				logStatement += statement;
				console.log(logStatement);
			break;
			case 4:
				logStatement += "4, WRN: ";
				logStatement += statement;
				console.log(logStatement);
			break;
			case 5:
				logStatement += "5, NTC: ";
				logStatement += statement;
				console.log(logStatement);
			break;
			case 6:
				logStatement += "6, INF: ";
				logStatement += statement;
				console.log(logStatement);
			break;
			case 7:
				logStatement += "7, DBG: ";
				logStatement += statement;
				console.log(logStatement);
			break;
			default:
				throw new error("Invalid log level submitted! Level: " + level + ", Statement: " + statement);
			break;
		}
	}
}