/**
 * Jest setup file
 *
 * This file is run before each test suite to set up the test environment.
 */

// Mock environment variables
process.env.DEBUG = "false";
process.env.LMTASKER_LOG_LEVEL = "error"; // Set to error to reduce noise in tests
process.env.DEFAULT_PRIORITY = "medium";
process.env.PROJECT_NAME = "Test Project";
process.env.PROJECT_VERSION = "1.0.0";

// Add global test helpers if needed
global.wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// If needed, silence console during tests
if (process.env.SILENCE_CONSOLE === "true") {
  global.console = {
    ...console,
    log: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  };
}
