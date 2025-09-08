#!/usr/bin/env node

/**
 * LM-Tasker
 * Author: Andreas Frangopoulos
 *
 */

/**
 * LM-Tasker
 * A task management system for AI-driven development with Agents
 */

// This file serves as the main entry point for the package
// The primary functionality is provided through the CLI commands

import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { createRequire } from "module";
import { spawn } from "child_process";
import { Command } from "commander";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Get package information
const packageJson = require("./package.json");

// Export the path to the dev.js script for programmatic usage
export const devScriptPath = resolve(__dirname, "./scripts/dev.js");


// Export version information
export const version = packageJson.version;

// CLI implementation
if (import.meta.url === `file://${process.argv[1]}`) {
  const program = new Command();

  program.name("lm-tasker").description("LM-Tasker CLI").version(version);


  program
    .command("dev")
    .description("Run the dev.js script")
    .allowUnknownOption(true)
    .action(() => {
      const args = process.argv.slice(process.argv.indexOf("dev") + 1);
      const child = spawn("node", [devScriptPath, ...args], {
        stdio: "inherit",
        cwd: process.cwd(),
      });

      child.on("close", (code) => {
        process.exit(code);
      });
    });

  // Add shortcuts for common dev.js commands
  program
    .command("list")
    .description("List all tasks")
    .action(() => {
      const child = spawn("node", [devScriptPath, "list"], {
        stdio: "inherit",
        cwd: process.cwd(),
      });

      child.on("close", (code) => {
        process.exit(code);
      });
    });

  program
    .command("next")
    .description("Show the next task to work on")
    .action(() => {
      const child = spawn("node", [devScriptPath, "next"], {
        stdio: "inherit",
        cwd: process.cwd(),
      });

      child.on("close", (code) => {
        process.exit(code);
      });
    });

  program
    .command("generate")
    .description("Generate task files")
    .action(() => {
      const child = spawn("node", [devScriptPath, "generate"], {
        stdio: "inherit",
        cwd: process.cwd(),
      });

      child.on("close", (code) => {
        process.exit(code);
      });
    });

  program.parse(process.argv);
}
