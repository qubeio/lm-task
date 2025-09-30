# LM-Tasker - Product Requirements Document

<PRD>

## Package Identity & Rebranding

### Package Information

- **Package Name**: `lm-tasker` (formerly `task-master-ai`)
- **Binary Commands**:
  - `lm-tasker`
  - `lm-tasker-mcp`
  - `lm-tasker-ai` (formerly `task-master-ai`)
- **Configuration File**: `.lmtaskerconfig` (formerly `.taskmasterconfig`)
- **Project Identity**: "LM-Tasker" (formerly "LM-Tasker")

### Migration Considerations

- **Breaking Change**: Users will need to update MCP
- **Command Changes**: All CLI commands change from `task-master` to `lm-tasker`
- **Config Migration**: `.taskmasterconfig` files need to be renamed to `.lmtaskerconfig`
- **Documentation**: All examples and references need updating
- **Simplified AI**: AI functionality limited to PRD parsing only (removes AI-powered task updates, additions, etc.)

### Simplified Architecture

The new architecture focuses on:

1. **Manual Task Management**: All task operations (add, update, modify) are manual via CLI/MCP
2. **AI-Powered PRD Parsing**: Only PRD-to-tasks conversion uses AI
3. **Reduced Complexity**: Eliminates complex AI prompt engineering for task management
4. **Lower Costs**: Minimal AI usage reduces operational costs
5. **Predictable Behavior**: Manual operations provide consistent, predictable results

# Technical Architecture

## System Components

1. **Task Management Core**

   - Tasks.json file structure (single source of truth)
   - Task model with dependencies, priorities, and metadata
   - Task state management system
   - Task file generation subsystem

2. **AI Integration Layer**

   - Limited AI integration for PRD parsing only
   - Multi-provider support for PRD parsing
   - Prompt engineering for PRD-to-tasks conversion
   - Response parsing for task generation

3. **Command Line Interface**

   - Command parsing and execution
   - Interactive user input handling
   - Display and formatting utilities
   - Status reporting and feedback system

4. **MCP Server Integration**
   - Model Context Protocol server implementation
   - Tool registration and execution
   - Cursor AI integration support
   - Structured data exchange

## Data Models

### Task Model

```json
{
  "id": 1,
  "title": "Task Title",
  "description": "Brief task description",
  "status": "pending|done|deferred|in-progress|review|cancelled",
  "dependencies": [0],
  "priority": "high|medium|low",
  "details": "Detailed implementation instructions",
  "testStrategy": "Verification approach details",
  "subtasks": [
    {
      "id": 1,
      "title": "Subtask Title",
      "description": "Subtask description",
      "status": "pending|done|deferred|in-progress|review|cancelled",
      "dependencies": [],
      "details": "Implementation details with timestamped updates"
    }
  ]
}
```

### Tasks Collection Model

```json
{
  "meta": {
    "projectName": "Project Name",
    "version": "1.0.0",
    "prdSource": "PRD.md",
    "createdAt": "ISO-8601 timestamp",
    "updatedAt": "ISO-8601 timestamp"
  },
  "tasks": [
    // Array of Task objects
  ]
}
```

### Task File Format

```
# Task ID: <id>
# Title: <title>
# Status: <status>
# Dependencies: <comma-separated list of dependency IDs>
# Priority: <priority>
# Description: <brief description>
# Details:
<detailed implementation notes>

# Test Strategy:
<verification approach>

# Subtasks:
1. <subtask title> - <subtask description>
```

## APIs and Integrations

1. **Limited AI Integration (PRD Parsing Only)**

   - Support for Azure OpenAI, OpenAI, Anthropic Claude, Google Gemini, Mistral, Perplexity, XAI, and Ollama
   - Authentication via API keys and endpoints
   - Model selection for PRD parsing operations
   - Direct API calls for PRD-to-tasks conversion
   - Error handling and retries for parsing operations
   - Cost tracking for PRD parsing usage

2. **File System API**

   - Reading/writing tasks.json
   - Managing individual task files
   - Command execution logging
   - Debug logging system

3. **MCP Protocol Integration**
   - Tool registration and discovery
   - Structured data exchange
   - Session management
   - Error handling and validation

## Infrastructure Requirements

1. **Node.js Runtime**

   - Version 14.0.0 or higher
   - ES Module support
   - File system access rights
   - Command execution capabilities

2. **Configuration Management**

   - .lmtaskerconfig file for basic settings and PRD parsing model selection
   - Environment variable handling for API keys (PRD parsing only)
   - Basic configuration management
   - Sensible defaults with overrides

3. **Development Environment**
   - Git repository
   - NPM package management
   - Cursor editor integration with MCP
   - Command-line terminal access

# Development Roadmap

## Phase 1: Core Task Management System ✅

1. **Task Data Structure** ✅

   - Implemented tasks.json structure
   - Created task model validation
   - Implemented basic task operations (create, read, update)
   - Developed file system interactions

2. **Command Line Interface Foundation** ✅

   - Implemented command parsing with Commander.js
   - Created help documentation
   - Implemented colorized console output
   - Added logging system with configurable levels

3. **Basic Task Operations** ✅

   - Implemented task listing functionality
   - Created task status update capability
   - Added dependency tracking
   - Implemented priority management

4. **Task File Generation** ✅
   - Created task file templates
   - Implemented generation from tasks.json
   - Added bi-directional synchronization
   - Implemented proper file naming and organization

## Phase 2: Limited AI Integration ✅

1. **PRD Parsing AI Integration** ✅

   - Implemented multi-provider API authentication for PRD parsing
   - Created prompt templates for PRD parsing
   - Designed response handlers for task generation
   - Added error management and retries

2. **PRD Parsing System** ✅

   - Implemented PRD file reading
   - Created PRD to task conversion logic
   - Added intelligent dependency inference
   - Implemented priority assignment logic

3. **Manual Task Management** ✅

   - Implemented manual task addition with user input
   - Created task updating through direct editing
   - Added manual task modification capabilities
   - Implemented parent-child relationship management

4. **Manual Task Updates** ✅
   - Added capability to manually update tasks
   - Implemented task editing through CLI commands
   - Created dependency chain management
   - Preserve completed work while allowing manual updates

## Phase 3: MCP Integration ✅

1. **MCP Server Implementation** ✅

   - Implemented Model Context Protocol server
   - Created tool registration system
   - Added structured data exchange
   - Implemented session management

2. **Tool Registration** ✅

   - Registered all core task management tools
   - Implemented parameter validation
   - Added error handling and responses
   - Created comprehensive tool documentation

3. **Cursor Integration** ✅

   - Created MCP configuration for Cursor
   - Implemented agent workflow guidelines
   - Added context management for agents
   - Created example interactions

4. **Project Initialization** ✅
   - Created project templating system
   - Implemented interactive setup
   - Added environment configuration
   - Created documentation generation

## Phase 4: Advanced Features ✅

1. **Batch Operations** ✅

   - Implemented multi-task status updates
   - Added task filtering and querying
   - Created advanced dependency management
   - Implemented task reorganization (move operations)

2. **Dependency Management** ✅

   - Implemented dependency validation
   - Added circular dependency detection
   - Created automatic dependency fixing
   - Implemented dependency visualization

3. **Configuration System** ✅

   - Created unified configuration management
   - Implemented model selection system
   - Added parameter configuration
   - Created API key management

4. **User Documentation** ✅
   - Created detailed README
   - Added comprehensive command reference
   - Implemented example workflows
   - Created troubleshooting guides

# Logical Dependency Chain

## Foundation Layer ✅

1. **Task Data Structure** - Core data model implementation
2. **Command Line Interface** - Primary user interaction mechanism
3. **Basic Task Operations** - Fundamental task management operations

## Functional Layer ✅

4. **Task File Generation** - Individual task file creation and management
5. **Azure OpenAI Integration** - AI capabilities for enhanced task generation
6. **PRD Parsing System** - Initial task generation from requirements

## Enhancement Layer ✅

7. **AI-Powered Task Management** - Enhanced task creation and modification
8. **Implementation Drift Handling** - Maintaining task relevance during development
9. **MCP Server Integration** - Protocol-based tool integration

## Advanced Layer ✅

10. **Batch Operations** - Efficiency improvements for multiple tasks
11. **Dependency Management** - Advanced relationship handling
12. **Configuration System** - Unified settings management
13. **User Documentation** - Complete user guidance

# Risks and Mitigations

## Technical Challenges

### Model Output Variability

**Risk**: AI models may produce inconsistent or unexpected outputs. **Mitigation**:

- Designed robust prompt templates with strict output formatting requirements
- Implemented response validation and error detection
- Added self-correction mechanisms and retries with improved prompts
- Allow manual editing of generated content

### Limited AI Integration Scope

**Risk**: AI integration limited to PRD parsing may require manual work for other operations. **Mitigation**:

- Designed clear manual workflows for all non-PRD operations
- Implemented intuitive CLI commands for task management
- Created comprehensive documentation for manual task operations
- Focused AI integration on the most complex operation (PRD parsing)

## MVP Definition

### Feature Prioritization

**Risk**: Including too many features in the MVP could delay release and adoption. **Mitigation**:

- Focused MVP on core task management + Azure OpenAI integration
- Removed complex features like task expansion and complexity analysis
- Implemented feature flags for easy enabling/disabling of features
- Got early user feedback to validate feature importance

### Scope Management

**Risk**: The project could expand beyond its original intent, becoming too complex. **Mitigation**:

- Maintained strict definition of core task management functionality
- Removed expansion and complexity analysis features to simplify
- Focus on task management for AI-driven development
- Evaluate new features against core value proposition

### User Expectations

**Risk**: Users might expect features that have been removed. **Mitigation**:

- Clearly communicate the tool's current capabilities and limitations
- Provide integration points with existing project management tools
- Focus on the unique value of AI-driven task management
- Document specific use cases and example workflows

## Resource Constraints

### Development Capacity

**Risk**: Limited development resources could delay implementation. **Mitigation**:

- Phased implementation to deliver value incrementally
- Focused on core functionality first
- Leveraged open source libraries where possible
- Designed for extensibility to allow community contributions

### AI Cost Management

**Risk**: PRD parsing API usage could lead to unexpected costs. **Mitigation**:

- Limited AI usage to PRD parsing operations only
- Implemented token usage tracking for PRD parsing
- Optimized PRD parsing prompts for token efficiency
- Clear cost expectations for users (one-time PRD parsing cost)

### Documentation Overhead

**Risk**: Complexity of the system requires extensive documentation that is time-consuming to maintain. **Mitigation**:

- Used AI to help generate and maintain documentation
- Created self-documenting commands and features
- Implemented progressive documentation (basic to advanced)
- Built help directly into the CLI and MCP tools

# Appendix

## AI Prompt Engineering Specifications

### PRD Parsing Prompt Structure

```
You are assisting with transforming a Product Requirements Document (PRD) into a structured set of development tasks.

Given the following PRD, create a comprehensive list of development tasks that would be needed to implement the described product.

For each task:
1. Assign a short, descriptive title
2. Write a concise description
3. Identify dependencies (which tasks must be completed before this one)
4. Assign a priority (high, medium, low)
5. Include detailed implementation notes
6. Describe a test strategy to verify completion

Structure the tasks in a logical order of implementation.

PRD:
{prd_content}
```

### Manual Task Management

Tasks are managed manually through CLI commands:

- `lm-tasker add-task --title="Task Title" --description="Task description"`
- `lm-tasker update-task --id=1 --title="Updated Title"`
- `lm-tasker set-status --id=1 --status=done`
- Task details are edited directly in task files or through CLI parameters
- No AI assistance for task creation, updates, or management (except PRD parsing)

## Task File System Specification

### Directory Structure

```
/
├── .cursor/
│   └── mcp.json
├── scripts/
│   ├── example_prd.txt
│   └── README.md
├── tasks/
│   ├── task_001.txt
│   ├── task_002.txt
│   ├── tasks.json
│   └── ...
├── .env
├── .env.example
├── .gitignore
├── .lmtaskerconfig
├── package.json
└── README.md
```

### Task ID Specification

- Main tasks: Sequential integers (1, 2, 3, ...)
- Subtasks: Parent ID + dot + sequential integer (1.1, 1.2, 2.1, ...)
- ID references: Used in dependencies, command parameters
- ID ordering: Implies suggested implementation order

## Command-Line Interface Specification

### Global Options

- `--help`: Display help information
- `--version`: Display version information
- `--file=<file>`: Specify an alternative tasks.json file
- `--quiet`: Reduce output verbosity
- `--debug`: Increase output verbosity
- `--json`: Output in JSON format (for programmatic use)

### Command Structure

- `lm-tasker <command> [options]`
- All commands operate on tasks.json by default
- Commands follow consistent parameter naming
- Common parameter styles: `--id=<id>`, `--status=<status>`, `--title="<title>"`, `--description="<text>"`
- Boolean flags: `--all`, `--force`, `--with-subtasks`

## API Integration Specifications

### PRD Parsing AI Configuration

- Authentication: Provider-specific API keys via environment variables (for PRD parsing only)
- Endpoints: Provider-specific endpoint configuration
- Model selection: Single model configured in .lmtaskerconfig file for PRD parsing
- Available providers: Azure OpenAI, OpenAI, Anthropic, Google, Mistral, Perplexity, XAI, Ollama
- Maximum tokens: Configurable for PRD parsing operations
- Temperature: Configurable for PRD parsing operations

### Configuration Management

- Primary config: .lmtaskerconfig file in project root
- API keys: Environment variables or .env file (for PRD parsing only)
- Model settings: Single model configuration for PRD parsing
- Global settings: logging, debug, project metadata
- Provider-specific: endpoint URL configuration for PRD parsing provider

## MCP Tool Reference

### Available Tools

- **Task Viewing**: get_tasks, get_task, next_task
- **Task Management**: add_task, update_task, update_subtask, set_task_status
- **Task Structure**: add_subtask, remove_task, clear_subtasks, move_task
- **Dependencies**: add_dependency, remove_dependency, validate_dependencies, fix_dependencies
- **File Generation**: generate

### Tool Categories

1. **Core Operations**: Basic task CRUD operations (manual)
2. **PRD Parsing**: Operations that use AI for PRD-to-tasks conversion
3. **Dependency Management**: Tools for managing task relationships
4. **File Operations**: Tools for generating and managing task files
5. **Configuration**: Tools for system configuration and PRD parsing model management

### Integration Points

- Cursor editor integration via MCP protocol
- CLI fallback for all MCP tools
- Structured data exchange for programmatic access
- Session management for stateful operations </PRD>
