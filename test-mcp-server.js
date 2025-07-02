#!/usr/bin/env node

import LMTaskerMCPServer from "./mcp-server/src/index.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

console.log("Starting MCP server test...");

async function testServer() {
  try {
    console.log("Creating server instance...");
    const server = new LMTaskerMCPServer();

    console.log("Initializing server...");
    await server.init();

    console.log("Server initialized successfully!");

    console.log("Starting server...");
    await server.start();

    console.log("Server started successfully!");

    // Stop after a short delay
    setTimeout(async () => {
      console.log("Stopping server...");
      await server.stop();
      console.log("Server stopped.");
      process.exit(0);
    }, 2000);
  } catch (error) {
    console.error("Error during server test:", error);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

testServer();
