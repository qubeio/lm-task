import fs from "fs";
import path from "path";
import chalk from "chalk";
import boxen from "boxen";
import { log } from "../utils.js";

/**
 * migrate-prd.js
 * Migration support for transitioning from legacy PRD formats
 * 
 * This module handles the migration from older PRD formats to the current
 * task structure. It maintains backward compatibility and provides a smooth
 * transition path for existing projects.
 * 
 * Provides backward compatibility and migration support for LM-Tasker PRD refactor
 * 
 * @module migrate-prd
 */

/**
 * Checks if a file path represents an old format PRD file
 * @param {string} filePath - Path to check
 * @returns {boolean} - True if it's an old format file
 */
export function isOldFormatPRD(filePath) {
  if (!filePath) return false;
  const fileName = path.basename(filePath).toLowerCase();
  return fileName === "prd.txt" || fileName.endsWith("/prd.txt");
}

/**
 * Checks if a file path is in the old scripts/ directory location
 * @param {string} filePath - Path to check
 * @returns {boolean} - True if it's in scripts/ directory
 */
export function isInScriptsDirectory(filePath) {
  if (!filePath) return false;
  const normalizedPath = path.normalize(filePath);
  // Only consider absolute paths for scripts/ directory detection
  if (!path.isAbsolute(normalizedPath)) return false;
  return (
    normalizedPath.includes(path.sep + "scripts" + path.sep) ||
    normalizedPath.endsWith(path.sep + "scripts")
  );
}

/**
 * Displays a deprecation warning for old PRD format usage
 * @param {string} oldPath - Path to the old format file
 * @param {string} outputFormat - Output format ('text' or 'json')
 * @param {Object} logFn - Logger function
 */
export function displayDeprecationWarning(
  oldPath,
  outputFormat = "text",
  logFn = log
) {
  const isOldFormat = isOldFormatPRD(oldPath);
  const isOldLocation = isInScriptsDirectory(oldPath);

  if (!isOldFormat && !isOldLocation) return;

  const warningMessage = buildWarningMessage(
    oldPath,
    isOldFormat,
    isOldLocation
  );

  if (outputFormat === "text") {
    console.log(
      boxen(
        chalk.yellow.bold("⚠️  DEPRECATION WARNING") + "\n\n" + warningMessage,
        {
          padding: 1,
          borderColor: "yellow",
          borderStyle: "round",
          margin: { top: 1, bottom: 1 },
        }
      )
    );
  } else {
    logFn("warn", `DEPRECATION WARNING: ${warningMessage.replace(/\n/g, " ")}`);
  }
}

/**
 * Builds the appropriate warning message based on the detected issues
 * @param {string} oldPath - Path to the old format file
 * @param {boolean} isOldFormat - Whether it's using old .txt format
 * @param {boolean} isOldLocation - Whether it's in old scripts/ location
 * @returns {string} - Formatted warning message
 */
function buildWarningMessage(oldPath, isOldFormat, isOldLocation) {
  let message = "";

  if (isOldFormat && isOldLocation) {
    message =
      `You are using the old PRD format and location: ${chalk.cyan(oldPath)}\n\n` +
      `${chalk.white.bold("Recommended migration:")}\n` +
      `• Move and convert to: ${chalk.green("PRD.md")} in your project root\n` +
      `• Use: ${chalk.yellow("task-master migrate-prd")} to migrate automatically\n\n` +
      `${chalk.white.bold("Why migrate?")}\n` +
      `• Better Markdown formatting and readability\n` +
      `• Improved parsing and AI analysis\n` +
      `• Consistent with modern documentation practices`;
  } else if (isOldFormat) {
    message =
      `You are using the old PRD file format: ${chalk.cyan(path.basename(oldPath))}\n\n` +
      `${chalk.white.bold("Recommended:")}\n` +
      `• Convert to: ${chalk.green("PRD.md")} for better formatting\n` +
      `• Use: ${chalk.yellow("task-master migrate-prd")} to convert automatically`;
  } else if (isOldLocation) {
    message =
      `You are using the old PRD location: ${chalk.cyan(oldPath)}\n\n` +
      `${chalk.white.bold("Recommended:")}\n` +
      `• Move to: ${chalk.green("PRD.md")} in your project root\n` +
      `• Use: ${chalk.yellow("task-master migrate-prd")} to migrate automatically`;
  }

  return message;
}

/**
 * Converts PRD content from plain text to Markdown format
 * @param {string} content - Original PRD content
 * @returns {string} - Markdown formatted content
 */
export function convertToMarkdown(content) {
  if (!content || typeof content !== "string") {
    return content;
  }

  // If content already looks like Markdown, return as-is
  if (
    content.includes("# ") ||
    content.includes("## ") ||
    content.includes("### ")
  ) {
    return content;
  }

  // Basic conversion: add proper Markdown structure
  let markdownContent = "";

  // Add a main title if not present
  const lines = content.split("\n");
  const firstLine = lines[0]?.trim();

  if (firstLine && !firstLine.startsWith("#")) {
    // If first line looks like a title, make it an H1
    if (
      firstLine.length < 100 &&
      !firstLine.includes(".") &&
      !firstLine.includes(",")
    ) {
      markdownContent += `# ${firstLine}\n\n`;
      lines.shift(); // Remove the first line since we used it as title
    } else {
      // Add a generic title
      markdownContent += "# Product Requirements Document\n\n";
    }
  }

  // Process remaining content
  const remainingContent = lines.join("\n").trim();

  // Simple heuristics to improve formatting
  const processedContent = remainingContent
    // Convert lines that look like section headers
    .replace(/^([A-Z][A-Za-z\s]+):?\s*$/gm, "## $1")
    // Convert numbered lists
    .replace(/^(\d+)\.\s+/gm, "$1. ")
    // Convert bullet points
    .replace(/^[-*]\s+/gm, "- ")
    // Ensure proper spacing around sections
    .replace(/\n(##\s)/g, "\n\n$1")
    .replace(/(##\s[^\n]+)\n([^\n])/g, "$1\n\n$2");

  markdownContent += processedContent;

  // Clean up extra whitespace
  markdownContent = markdownContent.replace(/\n{3,}/g, "\n\n").trim();

  return markdownContent;
}

/**
 * Migrates a PRD file from old format/location to new format/location
 * @param {string} sourcePath - Path to the source PRD file
 * @param {string} projectRoot - Project root directory
 * @param {Object} options - Migration options
 * @param {boolean} [options.force=false] - Overwrite existing files
 * @param {boolean} [options.keepOriginal=true] - Keep the original file
 * @param {string} [options.outputFormat='text'] - Output format
 * @param {Object} [options.logFn] - Logger function
 * @returns {Object} - Migration result
 */
export async function migratePRDFile(sourcePath, projectRoot, options = {}) {
  const {
    force = false,
    keepOriginal = true,
    outputFormat = "text",
    logFn = log,
  } = options;

  try {
    // Validate source file exists
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source PRD file not found: ${sourcePath}`);
    }

    // Read source content
    const sourceContent = fs.readFileSync(sourcePath, "utf8");
    if (!sourceContent.trim()) {
      throw new Error("Source PRD file is empty");
    }

    // Determine target path
    const targetPath = path.join(projectRoot, "PRD.md");

    // Check if target already exists
    if (fs.existsSync(targetPath) && !force) {
      throw new Error(
        `Target file already exists: ${targetPath}. Use --force to overwrite.`
      );
    }

    // Convert content to Markdown
    const markdownContent = convertToMarkdown(sourceContent);

    // Add migration header
    const migratedContent = addMigrationHeader(markdownContent, sourcePath);

    // Write to target location
    fs.writeFileSync(targetPath, migratedContent, "utf8");

    // Remove original file if requested
    if (!keepOriginal) {
      fs.unlinkSync(sourcePath);
    }

    const result = {
      success: true,
      sourcePath,
      targetPath,
      keptOriginal: keepOriginal,
    };

    // Display success message
    if (outputFormat === "text") {
      displayMigrationSuccess(result);
    } else {
      logFn(
        "success",
        `Successfully migrated PRD from ${sourcePath} to ${targetPath}`
      );
    }

    return result;
  } catch (error) {
    const result = {
      success: false,
      error: error.message,
      sourcePath,
    };

    if (outputFormat === "text") {
      console.error(chalk.red(`Migration failed: ${error.message}`));
    } else {
      logFn("error", `Migration failed: ${error.message}`);
    }

    return result;
  }
}

/**
 * Adds a migration header to the converted content
 * @param {string} content - Markdown content
 * @param {string} sourcePath - Original source path
 * @returns {string} - Content with migration header
 */
function addMigrationHeader(content, sourcePath) {
  const migrationDate = new Date().toISOString().split("T")[0];
  const header = `<!-- Migrated from ${sourcePath} on ${migrationDate} -->\n\n`;
  return header + content;
}

/**
 * Displays migration success message
 * @param {Object} result - Migration result object
 */
function displayMigrationSuccess(result) {
  const { sourcePath, targetPath, keptOriginal } = result;

  console.log(
    boxen(
      chalk.green.bold("✅ Migration Successful!") +
        "\n\n" +
        `${chalk.white.bold("From:")} ${chalk.cyan(sourcePath)}\n` +
        `${chalk.white.bold("To:")} ${chalk.green(targetPath)}\n\n` +
        (keptOriginal
          ? `${chalk.yellow("Original file preserved for safety")}\n`
          : `${chalk.yellow("Original file removed")}\n`) +
        `\n${chalk.white.bold("Next steps:")}\n` +
        `• Review the migrated ${chalk.green("PRD.md")} file\n` +
        `• Run ${chalk.yellow("task-master parse-prd")} to generate tasks\n` +
        (keptOriginal
          ? `• Remove ${chalk.cyan(path.basename(sourcePath))} when satisfied\n`
          : ""),
      {
        padding: 1,
        borderColor: "green",
        borderStyle: "round",
        margin: { top: 1, bottom: 1 },
      }
    )
  );
}

/**
 * Checks for mixed scenarios (both old and new formats present)
 * @param {string} projectRoot - Project root directory
 * @returns {Object} - Analysis of found PRD files
 */
export function analyzePRDFiles(projectRoot) {
  const analysis = {
    newFormat: [],
    oldFormat: [],
    mixed: false,
    recommendation: "",
  };

  // Check for new format files (PRD.md, prd.md in root)
  const newFormatPaths = [
    path.join(projectRoot, "PRD.md"),
    path.join(projectRoot, "prd.md"),
  ];

  for (const filePath of newFormatPaths) {
    if (fs.existsSync(filePath)) {
      analysis.newFormat.push(filePath);
    }
  }

  // Check for old format files
  const oldFormatPaths = [
    path.join(projectRoot, "PRD.txt"),
    path.join(projectRoot, "prd.txt"),
    path.join(projectRoot, "scripts", "PRD.md"),
    path.join(projectRoot, "scripts", "prd.md"),
    path.join(projectRoot, "scripts", "PRD.txt"),
    path.join(projectRoot, "scripts", "prd.txt"),
  ];

  for (const filePath of oldFormatPaths) {
    if (fs.existsSync(filePath)) {
      analysis.oldFormat.push(filePath);
    }
  }

  // Determine if mixed scenario
  analysis.mixed =
    analysis.newFormat.length > 0 && analysis.oldFormat.length > 0;

  // Generate recommendation
  if (analysis.mixed) {
    analysis.recommendation =
      "Multiple PRD files found. Consider consolidating to a single PRD.md in the project root.";
  } else if (analysis.oldFormat.length > 0) {
    analysis.recommendation =
      "Old format PRD files found. Consider migrating to PRD.md in the project root.";
  } else if (analysis.newFormat.length > 1) {
    analysis.recommendation =
      "Multiple new format PRD files found. Consider using a single PRD.md file.";
  } else {
    analysis.recommendation = "PRD file structure looks good.";
  }

  return analysis;
}

/**
 * Prompts user for migration during operations (for CLI use)
 * @param {string} oldPath - Path to old format file
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<boolean>} - Whether user wants to migrate
 */
export async function promptForMigration(oldPath, projectRoot) {
  // This is a placeholder for interactive prompting
  // In a real implementation, you'd use a library like inquirer
  // For now, we'll just return false to avoid blocking operations
  console.log(
    boxen(
      chalk.blue.bold("💡 Migration Available") +
        "\n\n" +
        `Found old format PRD: ${chalk.cyan(oldPath)}\n\n` +
        `Run ${chalk.yellow("task-master migrate-prd")} to migrate to the new format.`,
      {
        padding: 1,
        borderColor: "blue",
        borderStyle: "round",
        margin: { top: 1, bottom: 1 },
      }
    )
  );

  return false; // Don't auto-migrate, let user decide
}
