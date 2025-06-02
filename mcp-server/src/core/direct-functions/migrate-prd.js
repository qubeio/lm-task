import path from "path";
import fs from "fs";
import {
  migratePRDFile,
  analyzePRDFiles,
  isOldFormatPRD,
  isInScriptsDirectory,
} from "../../../../scripts/modules/task-manager/migrate-prd.js";
import { createLogWrapper } from "../../tools/utils.js";

/**
 * Direct function wrapper for migrating PRD files from old format to new format.
 *
 * @param {Object} args - Command arguments containing projectRoot, source, target, and options.
 * @param {Object} log - Logger object.
 * @param {Object} context - Context object containing session data.
 * @returns {Promise<Object>} - Result object with success status and data/error information.
 */
export async function migratePRDDirect(args, log, context = {}) {
  const { session } = context;
  const {
    source: sourceArg,
    target: targetArg,
    force = false,
    removeOriginal = false,
    analyze = false,
    projectRoot,
  } = args;

  // Create the standard logger wrapper
  const logWrapper = createLogWrapper(log);

  // --- Input Validation ---
  if (!projectRoot) {
    logWrapper.error("migratePRDDirect requires a projectRoot argument.");
    return {
      success: false,
      error: {
        code: "MISSING_ARGUMENT",
        message: "projectRoot is required.",
      },
    };
  }

  try {
    // Handle analyze option
    if (analyze) {
      logWrapper.info("Analyzing PRD files in project...");
      const analysis = analyzePRDFiles(projectRoot);

      return {
        success: true,
        data: {
          analysis,
          message: `Found ${analysis.newFormat.length} new format and ${analysis.oldFormat.length} old format PRD files`,
          recommendation: analysis.recommendation,
        },
      };
    }

    // Determine source file
    let sourcePath;

    if (!sourceArg) {
      // Auto-detect old format files
      logWrapper.info("Searching for old format PRD files...");
      const analysis = analyzePRDFiles(projectRoot);

      if (analysis.oldFormat.length === 0) {
        return {
          success: false,
          error: {
            code: "NO_OLD_FORMAT_FILES",
            message: "No old format PRD files found to migrate.",
          },
        };
      }

      if (analysis.oldFormat.length === 1) {
        sourcePath = analysis.oldFormat[0];
        logWrapper.info(
          `Found old format file: ${path.relative(projectRoot, sourcePath)}`
        );
      } else {
        return {
          success: false,
          error: {
            code: "MULTIPLE_OLD_FORMAT_FILES",
            message:
              "Multiple old format files found. Please specify which file to migrate using the source parameter.",
            files: analysis.oldFormat.map((f) => path.relative(projectRoot, f)),
          },
        };
      }
    } else {
      // Use specified source file
      sourcePath = path.isAbsolute(sourceArg)
        ? sourceArg
        : path.resolve(projectRoot, sourceArg);

      if (!fs.existsSync(sourcePath)) {
        return {
          success: false,
          error: {
            code: "SOURCE_FILE_NOT_FOUND",
            message: `Source file not found: ${sourcePath}`,
          },
        };
      }
    }

    // Determine target path
    const targetPath = targetArg
      ? path.isAbsolute(targetArg)
        ? targetArg
        : path.resolve(projectRoot, targetArg)
      : path.join(projectRoot, "PRD.md");

    logWrapper.info(`Migrating PRD file from ${sourcePath} to ${targetPath}`);

    // Perform migration
    const result = await migratePRDFile(sourcePath, projectRoot, {
      force,
      keepOriginal: !removeOriginal,
      outputFormat: "json",
      logFn: logWrapper,
    });

    if (result.success) {
      const successMsg = `Successfully migrated PRD from ${path.relative(projectRoot, sourcePath)} to ${path.relative(projectRoot, targetPath)}`;
      logWrapper.success(successMsg);

      return {
        success: true,
        data: {
          message: successMsg,
          sourcePath: path.relative(projectRoot, sourcePath),
          targetPath: path.relative(projectRoot, targetPath),
          keptOriginal: result.keptOriginal,
          nextSteps: [
            "Review the migrated PRD.md file",
            "Run parse-prd to generate tasks from the new format",
            ...(result.keptOriginal
              ? ["Remove the original file when satisfied"]
              : []),
          ],
        },
      };
    } else {
      return {
        success: false,
        error: {
          code: "MIGRATION_FAILED",
          message: result.error || "Migration failed for unknown reason",
        },
      };
    }
  } catch (error) {
    logWrapper.error(`Error executing PRD migration: ${error.message}`);
    return {
      success: false,
      error: {
        code: "MIGRATION_ERROR",
        message: error.message || "Unknown error during PRD migration",
      },
    };
  }
}

/**
 * Direct function wrapper for analyzing PRD files in a project.
 *
 * @param {Object} args - Command arguments containing projectRoot.
 * @param {Object} log - Logger object.
 * @param {Object} context - Context object containing session data.
 * @returns {Promise<Object>} - Result object with success status and analysis data.
 */
export async function analyzePRDFilesDirect(args, log, context = {}) {
  const { projectRoot } = args;
  const logWrapper = createLogWrapper(log);

  if (!projectRoot) {
    logWrapper.error("analyzePRDFilesDirect requires a projectRoot argument.");
    return {
      success: false,
      error: {
        code: "MISSING_ARGUMENT",
        message: "projectRoot is required.",
      },
    };
  }

  try {
    logWrapper.info("Analyzing PRD files in project...");
    const analysis = analyzePRDFiles(projectRoot);

    // Convert absolute paths to relative for better readability
    const relativeAnalysis = {
      ...analysis,
      newFormat: analysis.newFormat.map((f) => path.relative(projectRoot, f)),
      oldFormat: analysis.oldFormat.map((f) => path.relative(projectRoot, f)),
    };

    return {
      success: true,
      data: {
        analysis: relativeAnalysis,
        summary: {
          newFormatCount: analysis.newFormat.length,
          oldFormatCount: analysis.oldFormat.length,
          mixed: analysis.mixed,
          recommendation: analysis.recommendation,
        },
      },
    };
  } catch (error) {
    logWrapper.error(`Error analyzing PRD files: ${error.message}`);
    return {
      success: false,
      error: {
        code: "ANALYSIS_ERROR",
        message: error.message || "Unknown error during PRD analysis",
      },
    };
  }
}
