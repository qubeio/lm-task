import { initializeProject } from "../../../../scripts/init.js"; // Import core function and its logger if needed separately
import {
  enableSilentMode,
  disableSilentMode,
  // isSilentMode // Not used directly here
} from "../../../../scripts/modules/utils.js";
import os from "os"; // Import os module for home directory check

/**
 * Direct function wrapper for initializing a project.
 * Derives target directory from session, sets CWD, and calls core init logic.
 * @param {object} args - Arguments containing initialization options (addAliases, skipInstall, yes, projectRoot)
 * @param {object} log - The FastMCP logger instance.
 * @param {object} context - The context object, must contain { session }.
 * @returns {Promise<{success: boolean, data?: any, error?: {code: string, message: string}}>} - Standard result object.
 */
export async function initializeProjectDirect(args, log, context = {}) {
  const { session } = context; // Keep session if core logic needs it
  const homeDir = os.homedir();

  log.info(`Args received in direct function: ${JSON.stringify(args)}`);

  // --- Determine Target Directory ---
  // TRUST the projectRoot passed from the tool layer via args
  // The HOF in the tool layer already normalized and validated it came from a reliable source (args or session)
  const targetDirectory = args.projectRoot;

  // --- Validate the targetDirectory (basic sanity checks) ---
  if (
    !targetDirectory ||
    typeof targetDirectory !== "string" || // Ensure it's a string
    targetDirectory === "/" ||
    targetDirectory === homeDir
  ) {
    log.error(
      `Invalid target directory received from tool layer: '${targetDirectory}'`,
    );
    return {
      success: false,
      error: {
        code: "INVALID_TARGET_DIRECTORY",
        message: `Cannot initialize project: Invalid target directory '${targetDirectory}' received. Please ensure a valid workspace/folder is open or specified.`,
        details: `Received args.projectRoot: ${args.projectRoot}`, // Show what was received
      },
      fromCache: false,
    };
  }

  // --- Proceed with validated targetDirectory ---
  log.info(`Validated target directory for initialization: ${targetDirectory}`);

  const originalCwd = process.cwd();
  let resultData;
  let success = false;
  let errorResult = null;

  log.info(
    `Temporarily changing CWD to ${targetDirectory} for initialization.`,
  );
  process.chdir(targetDirectory); // Change CWD to the HOF-provided root

  enableSilentMode();
  try {
    // Construct options ONLY from the relevant flags in args
    // The core initializeProject operates in the current CWD, which we just set
    const options = {
      aliases: args.addAliases,
      skipInstall: args.skipInstall,
      yes: true, // Force yes mode
    };

    log.info(`Initializing project with options: ${JSON.stringify(options)}`);
    const result = await initializeProject(options); // Call core logic

    resultData = {
      message: "Project initialized successfully.",
      next_step:
        "Now that the project is initialized, you can start creating tasks manually. Use the add-task tool to create your first task, or use the list-tasks tool to see if there are any existing tasks in the project.",
      ...result,
    };
    success = true;
    log.info(
      `Project initialization completed successfully in ${targetDirectory}.`,
    );
  } catch (error) {
    log.error(`Core initializeProject failed: ${error.message}`);
    errorResult = {
      code: "INITIALIZATION_FAILED",
      message: `Core project initialization failed: ${error.message}`,
      details: error.stack,
    };
    success = false;
  } finally {
    disableSilentMode();
    log.info(`Restoring original CWD: ${originalCwd}`);
    process.chdir(originalCwd);
  }

  if (success) {
    return { success: true, data: resultData, fromCache: false };
  } else {
    return { success: false, error: errorResult, fromCache: false };
  }
}
