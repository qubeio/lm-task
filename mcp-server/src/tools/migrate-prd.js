import { z } from "zod";
import {
  migratePRDDirect,
  analyzePRDFilesDirect,
} from "../core/direct-functions/migrate-prd.js";
import { handleApiResult, withNormalizedProjectRoot } from "./utils.js";

// Zod schema for migrate-prd parameters
const migratePRDSchema = z.object({
  projectRoot: z
    .string()
    .describe("The directory of the project. Must be an absolute path."),
  source: z
    .string()
    .optional()
    .describe(
      "Path to the source PRD file to migrate. If not provided, will auto-detect old format files.",
    ),
  target: z
    .string()
    .optional()
    .describe(
      "Path where the migrated PRD.md file should be saved. Defaults to PRD.md in project root.",
    ),
  force: z
    .boolean()
    .default(false)
    .describe("Overwrite existing target file without prompting."),
  removeOriginal: z
    .boolean()
    .default(false)
    .describe("Remove the original file after successful migration."),
  analyze: z
    .boolean()
    .default(false)
    .describe("Only analyze PRD files without performing migration."),
});

/**
 * Register the migrate-prd tool with the MCP server
 * @param {Object} server - The MCP server instance
 */
export function registerMigratePRDTool(server) {
  server.addTool({
    name: "migrate_prd",
    description:
      "Migrate PRD files from old format/location to new PRD.md format in project root. Supports automatic detection of old format files and provides analysis of existing PRD files.",
    parameters: migratePRDSchema,
    execute: withNormalizedProjectRoot(async (args, { log, session }) => {
      try {
        const result = await migratePRDDirect(
          {
            projectRoot: args.projectRoot,
            source: args.source,
            target: args.target,
            force: args.force,
            removeOriginal: args.removeOriginal,
            analyze: args.analyze,
          },
          log,
          { session },
        );
        return handleApiResult(result, log);
      } catch (error) {
        log.error(`Error in migrate-prd tool: ${error.message}`);
        return {
          success: false,
          error: {
            code: "TOOL_ERROR",
            message: error.message || "Unknown error in migrate-prd tool",
          },
        };
      }
    }),
  });
}
