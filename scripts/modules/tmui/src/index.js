/**
 * TUI Entry Point
 * Main entry point for the TaskMaster Terminal User Interface
 */

import { program } from "commander";
import { TUIApp } from "./app.js";
import { getLmTaskerVersion } from "../../../../src/utils/getVersion.js";
import { findProjectRoot } from "../../utils.js";
import chalk from "chalk";

/**
 * Register the tmui command with the CLI
 * @param {Object} programInstance - Commander.js program instance
 */
export function registerTUICommand(programInstance) {
  programInstance
    .command("ui")
    .alias("tmui")
    .description("Launch the TaskMaster Terminal User Interface")
    .option("-f, --file <file>", "Path to tasks.json file")
    .option("--theme <theme>", "Color theme (default, dark, light)", "default")
    .option(
      "--refresh-interval <seconds>",
      "Auto-refresh interval in seconds",
      "30"
    )
    .option("--auto-refresh", "Enable automatic refresh (default: true)")
    .option("--no-auto-refresh", "Disable automatic refresh")
    .option(
      "--auto-refresh-interval <ms>",
      "Auto-refresh interval in milliseconds",
      "2000"
    )
    .option(
      "--snapshot",
      "Take a snapshot of the TUI and exit (for debugging/testing)"
    )
    .option(
      "--snapshot-delay <ms>",
      "Delay before taking snapshot in milliseconds",
      "2000"
    )
    .action(async (options) => {
      try {
        const projectRoot = findProjectRoot() || process.cwd();

        // Initialize and start the TUI application
        const app = new TUIApp({
          projectRoot,
          tasksFile: options.file,
          theme: options.theme,
          refreshInterval: parseInt(options.refreshInterval, 10),
          autoRefresh: options.autoRefresh !== false, // Default to true unless --no-auto-refresh is used
          autoRefreshInterval: parseInt(options.autoRefreshInterval, 10),
          snapshotMode: options.snapshot,
          snapshotDelay: parseInt(options.snapshotDelay, 10),
        });

        await app.start();
      } catch (error) {
        console.error(chalk.red("Error starting TUI:"), error.message);
        process.exit(1);
      }
    });
}

/**
 * Standalone CLI entry point for tmui command
 */
export async function runTUI() {
  	const version = await getLmTaskerVersion();

  program
    .name("ui")
    .description("TaskMaster Terminal User Interface")
    .version(version);

  registerTUICommand(program);

  program.parse();
}
