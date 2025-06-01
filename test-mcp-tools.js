#!/usr/bin/env node

import TaskMasterMCPServer from './mcp-server/src/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('Testing MCP tools registration...');

async function testTools() {
	try {
		console.log('Creating server instance...');
		const server = new TaskMasterMCPServer();

		console.log('Initializing server...');
		await server.init();

		console.log('Server initialized successfully!');

		// Access the FastMCP server instance to check tools
		const fastMcpServer = server.server;

		// Get list of registered tools
		console.log('\n=== Registered Tools ===');

		// FastMCP stores tools in a tools property
		if (fastMcpServer.tools) {
			const toolNames = Object.keys(fastMcpServer.tools);
			console.log(`Found ${toolNames.length} tools:`);
			toolNames.forEach((name) => {
				console.log(`  - ${name}`);
			});
		} else {
			console.log('No tools found or tools property not accessible');
		}

		console.log('\n=== Server Info ===');
		console.log(`Server name: ${server.options.name}`);
		console.log(`Server version: ${server.options.version}`);

		console.log('\nTools test completed successfully!');
	} catch (error) {
		console.error('Error during tools test:', error);
		console.error('Stack trace:', error.stack);
		process.exit(1);
	}
}

testTools();
