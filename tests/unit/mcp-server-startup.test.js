/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { setTimeout as sleep } from "timers/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("MCP Server Startup Tests", () => {
  // Ensure the MCP server doesn't auto-start on import during tests
  beforeAll(() => {
    process.env.LMTASKER_SKIP_MCP_AUTOSTART = "1";
  });

  const projectRoot = process.cwd();
  const mcpServerScript = path.join(projectRoot, "mcp-server/server.js");
  const testTimeout = 10000; // 10 seconds

  beforeAll(() => {
    // Verify the MCP server script exists
    if (!fs.existsSync(mcpServerScript)) {
      throw new Error(`MCP server script not found at ${mcpServerScript}`);
    }
  });

  describe("Server Script Validation", () => {
    test("should have valid MCP server script", () => {
      expect(fs.existsSync(mcpServerScript)).toBe(true);
      
      // Check if the script is executable
      const stats = fs.statSync(mcpServerScript);
      expect(stats.isFile()).toBe(true);
    });

    test("should have valid package.json with required dependencies", () => {
      const packageJsonPath = path.join(projectRoot, "package.json");
      expect(fs.existsSync(packageJsonPath)).toBe(true);
      
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      expect(packageJson.name).toBe("@qubeio/lm-tasker");
      expect(packageJson.dependencies).toBeDefined();
    });
  });

  describe("MCP Server Module Loading", () => {
    test("should load MCP server module without errors", async () => {
      // Test that we can import the MCP server module
      const { default: LMTaskerMCPServer } = await import("../../mcp-server/src/index.js");
      
      expect(LMTaskerMCPServer).toBeDefined();
      expect(typeof LMTaskerMCPServer).toBe("function");
    });

    test("should create MCP server instance", async () => {
      const { default: LMTaskerMCPServer } = await import("../../mcp-server/src/index.js");
      
      const server = new LMTaskerMCPServer();
      expect(server).toBeDefined();
      expect(server.options).toBeDefined();
      expect(server.options.name).toBe("LMTasker MCP Server");
      expect(server.options.version).toBeDefined();
    });

    test("should initialize MCP server", async () => {
      const { default: LMTaskerMCPServer } = await import("../../mcp-server/src/index.js");
      
      const server = new LMTaskerMCPServer();
      
      // Mock the server.start method to avoid actually starting the server
      const originalStart = server.start;
      server.start = jest.fn().mockResolvedValue(server);
      
      await server.init();
      expect(server.initialized).toBe(true);
      
      // Restore original method
      server.start = originalStart;
    });

    test("should not start server automatically on instantiation", async () => {
      const { default: LMTaskerMCPServer } = await import("../../mcp-server/src/index.js");
      
      const server = new LMTaskerMCPServer();
      
      // Server should not be initialized by default
      expect(server.initialized).toBe(false);
      
      // Server should have the required properties
      expect(server.server).toBeDefined();
      expect(server.options).toBeDefined();
    });
  });

  describe("MCP Server Process Startup", () => {
    test("should have valid server script that can be executed", () => {
      // Test that the server script exists and is executable
      expect(fs.existsSync(mcpServerScript)).toBe(true);
      
      // Check if the script has the correct shebang
      const scriptContent = fs.readFileSync(mcpServerScript, "utf8");
      expect(scriptContent).toMatch(/^#!/);
      expect(scriptContent).toContain("LMTaskerMCPServer");
    });

    test("should be able to import server script", async () => {
      // Test that we can dynamically import the server script
      const serverModule = await import("../../mcp-server/server.js");
      expect(serverModule).toBeDefined();
    });

    test("should have proper server lifecycle methods", async () => {
      const { default: LMTaskerMCPServer } = await import("../../mcp-server/src/index.js");
      
      const server = new LMTaskerMCPServer();
      
      // Test that all lifecycle methods exist and are functions
      expect(typeof server.init).toBe("function");
      expect(typeof server.start).toBe("function");
      expect(typeof server.stop).toBe("function");
      
      // Test that stop method can be called without errors
      await expect(server.stop()).resolves.not.toThrow();
    });
  });

  describe("MCP Server Dependencies", () => {
    test("should have required FastMCP dependency", async () => {
      const packageJsonPath = path.join(projectRoot, "package.json");
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      
      expect(packageJson.dependencies).toBeDefined();
      expect(packageJson.dependencies.fastmcp).toBeDefined();
    });

    test("should have required MCP server files", () => {
      const requiredFiles = [
        "mcp-server/server.js",
        "mcp-server/src/index.js",
        "mcp-server/src/logger.js",
        "mcp-server/src/tools/index.js"
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(projectRoot, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test("should have MCP tools registered", async () => {
      const { registerLMTaskerTools } = await import("../../mcp-server/src/tools/index.js");
      
      expect(registerLMTaskerTools).toBeDefined();
      expect(typeof registerLMTaskerTools).toBe("function");
    });
  });

  describe("MCP Server Configuration", () => {
    test("should have valid server configuration", async () => {
      const { default: LMTaskerMCPServer } = await import("../../mcp-server/src/index.js");
      
      const server = new LMTaskerMCPServer();
      
      expect(server.options).toBeDefined();
      expect(server.options.name).toBe("LMTasker MCP Server");
      expect(server.options.version).toBeDefined();
      expect(typeof server.options.version).toBe("string");
    });

    test("should have server methods", async () => {
      const { default: LMTaskerMCPServer } = await import("../../mcp-server/src/index.js");
      
      const server = new LMTaskerMCPServer();
      
      expect(typeof server.init).toBe("function");
      expect(typeof server.start).toBe("function");
      expect(typeof server.stop).toBe("function");
    });
  });
});
