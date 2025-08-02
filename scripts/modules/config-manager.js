/**
 * config-manager.js
 * Minimal configuration management for LM-Tasker (AI functionality removed)
 * Provides hardcoded defaults instead of reading from .lmtaskerconfig files
 */

// Default configuration values (hardcoded since no config file is needed)
const DEFAULTS = {
  global: {
    logLevel: "info",
    debug: false,
    defaultSubtasks: 5,
    defaultPriority: "medium",
    projectName: "LM-Tasker",
  },
};

// Custom Error for configuration issues (kept for compatibility)
class ConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConfigurationError";
  }
}

/**
 * Get the configuration object (returns hardcoded defaults)
 * @param {string} explicitRoot - Ignored, kept for compatibility
 * @param {boolean} forceReload - Ignored, kept for compatibility
 * @returns {Object} The configuration object
 */
function getConfig(explicitRoot = null, forceReload = false) {
  return DEFAULTS;
}

/**
 * Get global configuration (returns hardcoded defaults)
 * @param {string} explicitRoot - Ignored, kept for compatibility
 * @returns {Object} Global configuration
 */
function getGlobalConfig(explicitRoot = null) {
  return DEFAULTS.global;
}

/**
 * Get log level
 * @param {string} explicitRoot - Ignored, kept for compatibility
 * @returns {string} Log level
 */
function getLogLevel(explicitRoot = null) {
  return DEFAULTS.global.logLevel;
}

/**
 * Get debug flag
 * @param {string} explicitRoot - Ignored, kept for compatibility
 * @returns {boolean} Debug flag
 */
function getDebugFlag(explicitRoot = null) {
  return DEFAULTS.global.debug;
}

/**
 * Get default number of subtasks
 * @param {string} explicitRoot - Ignored, kept for compatibility
 * @returns {number} Default number of subtasks
 */
function getDefaultSubtasks(explicitRoot = null) {
  return DEFAULTS.global.defaultSubtasks;
}

/**
 * Get default priority
 * @param {string} explicitRoot - Ignored, kept for compatibility
 * @returns {string} Default priority
 */
function getDefaultPriority(explicitRoot = null) {
  return DEFAULTS.global.defaultPriority;
}

/**
 * Get project name
 * @param {string} explicitRoot - Ignored, kept for compatibility
 * @returns {string} Project name
 */
function getProjectName(explicitRoot = null) {
  return DEFAULTS.global.projectName;
}

/**
 * Write configuration to file (no-op since no config file is used)
 * @param {Object} config - Ignored
 * @param {string} explicitRoot - Ignored
 */
function writeConfig(config, explicitRoot = null) {
  // No-op since we don't use config files anymore
  console.log("[CONFIG] Configuration files are no longer used in LM-Tasker");
}

/**
 * Check if configuration file is present (always returns false)
 * @param {string} explicitRoot - Ignored, kept for compatibility
 * @returns {boolean} Always false since no config file is used
 */
function isConfigFilePresent(explicitRoot = null) {
  return false;
}

/**
 * Get user ID (simplified - returns a basic identifier)
 * @param {string} explicitRoot - Ignored, kept for compatibility
 * @returns {string} User ID
 */
function getUserId(explicitRoot = null) {
  // For now, return a simple identifier
  return "user";
}

/**
 * Find the project root directory (simplified - returns current directory)
 * @returns {string} The current working directory
 */
function findProjectRoot() {
  return process.cwd();
}

export {
  getConfig,
  getGlobalConfig,
  getLogLevel,
  getDebugFlag,
  getDefaultSubtasks,
  getDefaultPriority,
  getProjectName,
  writeConfig,
  isConfigFilePresent,
  getUserId,
  findProjectRoot,
  ConfigurationError,
  DEFAULTS,
};
