/**
 * config-manager.js
 * Configuration management for LM-Tasker (AI functionality removed)
 */

import fs from "fs";
import path from "path";
import chalk from "chalk";

const CONFIG_FILE_NAME = ".lmtaskerconfig";

// Default configuration values (used if .lmtaskerconfig is missing or incomplete)
const DEFAULTS = {
  global: {
    logLevel: "info",
    debug: false,
    defaultSubtasks: 5,
    defaultPriority: "medium",
    projectName: "LM-Tasker",
  },
};

// --- Internal Config Loading ---
let loadedConfig = null;
let loadedConfigRoot = null; // Track which root loaded the config

// Custom Error for configuration issues
class ConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConfigurationError";
  }
}

function _loadAndValidateConfig(explicitRoot = null) {
  const defaults = DEFAULTS; // Use the defined defaults
  let rootToUse = explicitRoot;
  let configSource = explicitRoot
    ? `explicit root (${explicitRoot})`
    : "defaults (no root provided yet)";

  // ---> If no explicit root, TRY to find it <---
  if (!rootToUse) {
    rootToUse = findProjectRoot();
    if (rootToUse) {
      configSource = `found root (${rootToUse})`;
    } else {
      // No root found, return defaults immediately
      return defaults;
    }
  }
  // ---> End find project root logic <---

  // --- Proceed with loading from the determined rootToUse ---
  const configPath = path.join(rootToUse, CONFIG_FILE_NAME);
  let config = { ...defaults }; // Start with a deep copy of defaults
  let configExists = false;

  if (fs.existsSync(configPath)) {
    configExists = true;
    try {
      const rawData = fs.readFileSync(configPath, "utf-8");
      const parsedConfig = JSON.parse(rawData);

      // Deep merge parsed config onto defaults
      config = {
        global: { ...defaults.global, ...parsedConfig?.global },
      };

      console.log(
        `[CONFIG] Loaded configuration from ${configSource} (${configPath})`,
      );
    } catch (error) {
      console.error(
        chalk.red(
          `[CONFIG] Error parsing configuration file ${configPath}: ${error.message}`,
        ),
      );
      throw new ConfigurationError(
        `Failed to parse configuration file: ${error.message}`,
      );
    }
  } else {
    console.log(
      `[CONFIG] No configuration file found at ${configPath}, using defaults`,
    );
  }

  // Validate the merged configuration
  if (!config.global) {
    config.global = { ...defaults.global };
  }

  // Ensure all required global fields exist
  const requiredGlobalFields = [
    "logLevel",
    "debug",
    "defaultSubtasks",
    "defaultPriority",
    "projectName",
  ];

  for (const field of requiredGlobalFields) {
    if (config.global[field] === undefined) {
      config.global[field] = defaults.global[field];
    }
  }

  return config;
}

/**
 * Find the project root directory by looking for .lmtaskerconfig
 * @returns {string|null} The project root path or null if not found
 */
function findProjectRoot() {
  let currentDir = process.cwd();
  const maxDepth = 10; // Prevent infinite loops
  let depth = 0;

  while (depth < maxDepth) {
    const configPath = path.join(currentDir, CONFIG_FILE_NAME);
    if (fs.existsSync(configPath)) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      // Reached filesystem root
      break;
    }
    currentDir = parentDir;
    depth++;
  }

  return null;
}

/**
 * Get the configuration object
 * @param {string} explicitRoot - Explicit project root path
 * @param {boolean} forceReload - Force reload the configuration
 * @returns {Object} The configuration object
 */
function getConfig(explicitRoot = null, forceReload = false) {
  // If we have a cached config and it's from the same root, return it
  if (
    !forceReload &&
    loadedConfig &&
    loadedConfigRoot === (explicitRoot || findProjectRoot())
  ) {
    return loadedConfig;
  }

  // Load and cache the configuration
  loadedConfig = _loadAndValidateConfig(explicitRoot);
  loadedConfigRoot = explicitRoot || findProjectRoot();

  return loadedConfig;
}

/**
 * Get global configuration
 * @param {string} explicitRoot - Explicit project root path
 * @returns {Object} Global configuration
 */
function getGlobalConfig(explicitRoot = null) {
  const config = getConfig(explicitRoot);
  return config.global || DEFAULTS.global;
}

/**
 * Get log level
 * @param {string} explicitRoot - Explicit project root path
 * @returns {string} Log level
 */
function getLogLevel(explicitRoot = null) {
  const global = getGlobalConfig(explicitRoot);
  return global.logLevel || "info";
}

/**
 * Get debug flag
 * @param {string} explicitRoot - Explicit project root path
 * @returns {boolean} Debug flag
 */
function getDebugFlag(explicitRoot = null) {
  const global = getGlobalConfig(explicitRoot);
  return global.debug || false;
}

/**
 * Get default number of subtasks
 * @param {string} explicitRoot - Explicit project root path
 * @returns {number} Default number of subtasks
 */
function getDefaultSubtasks(explicitRoot = null) {
  const global = getGlobalConfig(explicitRoot);
  return global.defaultSubtasks || 5;
}

/**
 * Get default priority
 * @param {string} explicitRoot - Explicit project root path
 * @returns {string} Default priority
 */
function getDefaultPriority(explicitRoot = null) {
  const global = getGlobalConfig(explicitRoot);
  return global.defaultPriority || "medium";
}

/**
 * Get project name
 * @param {string} explicitRoot - Explicit project root path
 * @returns {string} Project name
 */
function getProjectName(explicitRoot = null) {
  const global = getGlobalConfig(explicitRoot);
  return global.projectName || "LM-Tasker";
}

/**
 * Write configuration to file
 * @param {Object} config - Configuration object to write
 * @param {string} explicitRoot - Explicit project root path
 */
function writeConfig(config, explicitRoot = null) {
  const rootToUse = explicitRoot || findProjectRoot();
  if (!rootToUse) {
    throw new ConfigurationError(
      "Cannot write configuration: no project root found",
    );
  }

  const configPath = path.join(rootToUse, CONFIG_FILE_NAME);
  
  try {
    // Ensure the directory exists
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Write the configuration file
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
    console.log(`[CONFIG] Configuration written to ${configPath}`);
    
    // Update cached config
    loadedConfig = config;
    loadedConfigRoot = rootToUse;
  } catch (error) {
    throw new ConfigurationError(
      `Failed to write configuration file: ${error.message}`,
    );
  }
}

/**
 * Check if configuration file is present
 * @param {string} explicitRoot - Explicit project root path
 * @returns {boolean} True if config file exists
 */
function isConfigFilePresent(explicitRoot = null) {
  const rootToUse = explicitRoot || findProjectRoot();
  if (!rootToUse) {
    return false;
  }
  
  const configPath = path.join(rootToUse, CONFIG_FILE_NAME);
  return fs.existsSync(configPath);
}

/**
 * Get user ID (simplified - returns a basic identifier)
 * @param {string} explicitRoot - Explicit project root path
 * @returns {string} User ID
 */
function getUserId(explicitRoot = null) {
  // For now, return a simple identifier based on project root
  const rootToUse = explicitRoot || findProjectRoot();
  if (!rootToUse) {
    return "unknown";
  }
  
  // Use the last part of the project path as a simple identifier
  return path.basename(rootToUse) || "unknown";
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
  CONFIG_FILE_NAME,
  DEFAULTS,
};
