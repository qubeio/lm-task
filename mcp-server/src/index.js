import { FastMCP } from "fastmcp";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import fs from "fs";
import logger from "./logger.js";
import { registerLMTaskerTools } from "./tools/index.js";

// Load environment variables
dotenv.config();

// Constants
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main MCP server class that integrates with LMTasker
 */
class LMTaskerMCPServer {
  constructor() {
    // Get version from package.json using synchronous fs
    const packagePath = path.join(__dirname, "../../package.json");
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

    this.options = {
      name: "LMTasker MCP Server",
      version: packageJson.version,
    };

    this.server = new FastMCP(this.options);
    this.initialized = false;

    // Add empty resources (these respond to resources/list)
    this.server.addResource({});
    this.server.addResourceTemplate({});
    
    // Store reference for adding tool-based resources after initialization
    this.toolResourcesAdded = false;

    // Enhanced logging for debugging client requests
    logger.info(`[MCP INIT] Starting LM-Tasker MCP Server v${packageJson.version}`);
    logger.info(`[MCP INIT] Server will expose tools via tools/list and resources via resources/list`);

    // Bind methods
    this.init = this.init.bind(this);
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);

    // Setup logging
    this.logger = logger;
  }

  /**
   * Workaround: Add tools as resources for clients that only check resources/list
   */
  addToolsAsResources() {
    // Add a resource that lists all available tools
    this.server.addResource({
      uri: "lm-tasker://tools/available",
      name: "Available LM-Tasker Tools",
      description: "List of all available LM-Tasker MCP tools",
      mimeType: "application/json"
    });

    // Add individual tool documentation as resources
    const toolNames = [
      "get_tasks", "get_task", "next_task", 
      "set_task_status", "add_task", "add_subtask", "remove_task", "remove_subtask",
      "clear_subtasks", "move_task", "update_task", "update_subtask",
      "add_dependency", "remove_dependency", "validate_dependencies", "fix_dependencies",
      "generate"
    ];

    toolNames.forEach(toolName => {
      this.server.addResource({
        uri: `lm-tasker://tool/${toolName}`,
        name: `LM-Tasker Tool: ${toolName}`,
        description: `Documentation and usage for the ${toolName} tool`,
        mimeType: "text/plain"
      });
    });

    logger.info(`[MCP WORKAROUND] Added ${toolNames.length} tools as resources for Warp compatibility`);
  }

  /**
   * Initialize the MCP server with necessary tools and routes
   */
  async init() {
    if (this.initialized) return;

    // Register all LM-Tasker tools - this makes them available via tools/list
    registerLMTaskerTools(this.server, this.asyncManager);

    // Workaround for Warp: Add tools as resources too
    if (!this.toolResourcesAdded) {
      this.addToolsAsResources();
      this.toolResourcesAdded = true;
    }

    // Log how many tools were registered
    logger.info(`[MCP INIT] Registered LM-Tasker tools successfully`);

    this.initialized = true;

    return this;
  }

  /**
   * Start the MCP server
   */
  async start() {
    if (!this.initialized) {
      await this.init();
    }

    // Start the FastMCP server with increased timeout
    await this.server.start({
      transportType: "stdio",
      timeout: 120000, // 2 minutes timeout (in milliseconds)
    });

    return this;
  }

  /**
   * Stop the MCP server
   */
  async stop() {
    if (this.server) {
      await this.server.stop();
    }
  }
}

export default LMTaskerMCPServer;
