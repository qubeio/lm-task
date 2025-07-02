import fs from "fs";
import path from "path";

const logFilePath = path.resolve(process.cwd(), "tui_debug.log");

// Ensure the log file exists
fs.writeFileSync(logFilePath, "", { flag: "a" });

export const logger = {
  log: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] LOG: ${message}\n`;
    fs.appendFileSync(logFilePath, logMessage);
  },
  error: (message, errorObj) => {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] ERROR: ${message}\n`;
    if (errorObj) {
      logMessage += `    Error Details: ${errorObj.message}\n`;
      if (errorObj.stack) {
        logMessage += `    Stack Trace:\n${errorObj.stack}\n`;
      }
    }
    fs.appendFileSync(logFilePath, logMessage);
  },
  clear: () => {
    fs.writeFileSync(logFilePath, ""); // Overwrite with empty content
  },
};

// Clear the log file on initial load for a fresh session
logger.clear();
logger.log("Logger initialized. Application starting...");
