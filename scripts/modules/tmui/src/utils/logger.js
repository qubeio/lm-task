import fs from "fs";
import path from "path";

const logFilePath = path.resolve(process.cwd(), "tui_debug.log");
const isDebugEnabled = process.env.DEBUG === "1" || process.env.DEBUG === "true";

// Only create the log file if DEBUG is enabled
if (isDebugEnabled) {
  // Ensure the log file exists
  fs.writeFileSync(logFilePath, "", { flag: "a" });
}

export const logger = {
  log: (message) => {
    if (!isDebugEnabled) return;
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] LOG: ${message}\n`;
    fs.appendFileSync(logFilePath, logMessage);
  },
  warn: (message) => {
    if (!isDebugEnabled) return;
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] WARN: ${message}\n`;
    fs.appendFileSync(logFilePath, logMessage);
  },
  error: (message, errorObj) => {
    if (!isDebugEnabled) return;
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
    if (!isDebugEnabled) return;
    fs.writeFileSync(logFilePath, ""); // Overwrite with empty content
  },
};

// Only initialize logging if DEBUG is enabled
if (isDebugEnabled) {
  // Clear the log file on initial load for a fresh session
  logger.clear();
  logger.log("Logger initialized. Application starting...");
}
