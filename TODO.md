# LM-Tasker Rebranding TODO

Read the PRD.MD for context
This document tracks the complete rebranding from "TaskMaster" to "LM-Tasker".

## 🎯 Overview

- **Package name**: `task-master-ai` → `lm-tasker`
- **Binary commands**: `task-master`, `task-master-mcp`, `task-master-ai` → `lm-tasker`, `lm-tasker-mcp`, `lm-tasker-ai`
- **Project identity**: "Task Master" → "LM-Tasker"
- **Configuration files**: `.taskmasterconfig` → `.lmtaskerconfig`

## Phase 1: Core Package Identity

### 1.1 Package Configuration ✅

- [x] **package.json** - Update:
  - [x] `name`: `"task-master-ai"` → `"lm-tasker"`
  - [x] `description`: Update to reference "LM-Tasker"
  - [x] `bin` entries:
    - [x] `"task-master"` → `"lm-tasker"`
    - [x] `"task-master-mcp"` → `"lm-tasker-mcp"`
    - [x] `"task-master-ai"` → `"lm-tasker-ai"`
  - [x] `repository.url`: Update GitHub repository reference
  - [x] `homepage`: Update homepage URL
  - [x] `bugs.url`: Update issues URL
  - [x] `files`: Remove `README-task-master.md` reference if present
  - [x] `keywords`: Update to include "lm-tasker" instead of "task-master"

### 1.2 Binary Files ✅

- [x] **Rename file**: `bin/task-master.js` → `bin/lm-tasker.js`
- [x] **Update binary content**:
  - [x] File header comments
  - [x] Help text and descriptions
  - [x] Error messages
  - [x] Command examples
  - [x] Debug output

### 1.3 Entry Points ✅

- [x] **index.js** - Update:
  - [x] Description and comments
  - [x] CLI program description
  - [x] Any hardcoded references

## Phase 2: Configuration System ✅

### 2.1 Config File Name ✅

- [x] **scripts/modules/config-manager.js**:
  - [x] `CONFIG_FILE_NAME`: `.taskmasterconfig` → `.lmtaskerconfig`
  - [x] All error messages mentioning config file
  - [x] Documentation strings
  - [x] Default project name: `'Task Master'` → `'LM-Tasker'`

### 2.2 Utility Functions ✅

- [x] **scripts/modules/utils.js**:
  - [x] Update `findProjectRoot()` markers to include `.lmtaskerconfig`
  - [x] Update TaskMaster project detection logic
  - [x] Update comments and documentation

### 2.3 Version Functions ✅

- [x] **src/utils/getVersion.js**:
  - [x] `getTaskMasterVersion()` → `getLmTaskerVersion()`
  - [x] Update all imports in:
    - [x] `scripts/modules/commands.js`
    - [x] `scripts/modules/ui.js`
    - [x] `scripts/modules/tmui/src/index.js`

### 2.4 Additional Files Updated ✅

- [x] **scripts/modules/task-manager/models.js**: Updated all config file references and command names
- [x] **.gitignore**: Updated to ignore `.lmtaskerconfig` instead of `.taskmasterconfig`
- [x] **scripts/init.js**: Updated template file copying for new config name

## Phase 3: User Interface & Display ✅

### 3.1 UI Components ✅

- [x] **scripts/modules/ui.js**:
  - [x] Banner text: `figlet.textSync("Task Master")` → `figlet.textSync("LM-Tasker")`
  - [x] Help text and descriptions
  - [x] Error messages
  - [x] CLI help content
  - [x] Configuration file references
  - [x] Function imports (getLmTaskerVersion)

### 3.2 Command Interface ✅

- [x] **scripts/modules/commands.js**:
  - [x] All command descriptions
  - [x] Help text and examples
  - [x] Error messages with command references
  - [x] Usage examples (e.g., `task-master parse-prd` → `lm-tasker parse-prd`)
  - [x] Function imports (getLmTaskerVersion)

### 3.3 Initialization Scripts ✅

- [x] **scripts/init.js**:
  - [x] Banner text: `figlet.textSync("Task Master AI")` → `figlet.textSync("LM-Tasker")`
  - [x] Shell alias creation (update aliases to use `lm-tasker`)
  - [x] Comments and documentation
  - [x] Default project descriptions

## Phase 4: Documentation ✅

### 4.1 Primary Documentation ✅

- [x] **PRD.md**:
  - [x] Title: "Claude Task Master" → "LM-Tasker"
  - [x] All references throughout the document
  - [x] Technical architecture descriptions
  - [x] Example configurations

- [x] **README.md**:
  - [x] Ensure consistency (currently shows "LM-Tasker" in some places)
  - [x] All command examples
  - [x] Installation instructions
  - [x] MCP configuration examples

- [x] **CHANGELOG.md**:
  - [x] Header: `# task-master-ai` → `# lm-tasker`

### 4.2 Documentation Directory ✅

- [x] **docs/README.md**: Update all references
- [x] **docs/configuration.md**: Update config file names and command references
- [x] **docs/tutorial.md**: Update all command examples and references
- [x] **docs/examples.md**: Update all command examples
- [x] **docs/command-reference.md**: Update all command names and examples
- [x] **docs/task-structure.md**: Update any references
- [x] **docs/models.md**: Update any references

### 4.3 Assets & Examples ✅

- [x] **assets/AGENTS.md**:
  - [x] Title: "Task Master AI" → "LM-Tasker"
  - [x] All command examples
  - [x] MCP configuration examples

- [x] **assets/scripts_README.md**: Update all references

- [x] **assets/.windsurfrules**:
  - [x] All tool descriptions
  - [x] Command examples
  - [x] MCP tool references

- [x] **assets/env.example**: Check for any references

### 4.4 Example Files ✅

- [x] **scripts/example_prd.md**: Update any references to Task Master
- [x] **scripts/example_prd.txt**: Update any references to Task Master

## Phase 5: Code References ✅

### 5.1 Core Modules ✅

- [x] **scripts/modules/task-manager.js**: Update file header comments
- [x] **scripts/modules/task-manager/*.js**: Update all file headers and comments
- [x] **scripts/modules/ai-services-unified.js**: Update comments and references (No changes needed - no Task Master references found)
- [x] **scripts/modules/dependency-manager.js**: Update comments (No changes needed - no Task Master references found)
- [x] **scripts/modules/rule-transformer.js**: Update any references (No changes needed - no Task Master references found)

### 5.2 MCP Server ✅

- [x] **mcp-server/src/index.js**:
  - [x] Server name: `'Task Master MCP Server'` → `'LM-Tasker MCP Server'`
  - [x] Comments and descriptions
  - [x] Class name: `TaskMasterMCPServer` → `LmTaskerMCPServer`

- [x] **mcp-server/src/tools/*.js**: Update all tool descriptions mentioning "Task Master"
- [x] **mcp-server/src/core/context-manager.js**: Update comments
- [x] **mcp-server/src/core/utils/path-utils.js**: Update comments
- [x] **mcp-server/src/tools/utils.js**: Update comments

### 5.3 Source Files ✅

- [x] **src/utils/output.js**: Check for references (No changes needed - file is empty)
- [x] **src/constants/task-status.js**: Check for references (No changes needed - no Task Master references found)
- [x] **src/ai-providers/azure.js**: Check for references (No changes needed - no Task Master references found)

## Phase 6: Testing & Validation ✅

### 6.1 Unit Tests ✅

- [x] **tests/unit/init.test.js**: Update mock banner text and references
- [x] **tests/unit/config-manager.test.js**: Update config file references
- [x] **tests/unit/config-manager.test.mjs**: Update config file references
- [x] **tests/unit/ui.test.js**: Update banner text mocks
- [x] **tests/unit/commands.test.js**: Update command references
- [x] **tests/unit/task-manager.test.js**: Update references (No changes needed - no Task Master references found)
- [x] **tests/unit/utils.test.js**: Update references
- [x] **tests/unit/ai-services-unified.test.js**: Update references (No changes needed - no Task Master references found)
- [x] **tests/unit/migrate-prd.test.js**: Update command references
- [x] **tests/unit/kebab-case-validation.test.js**: Update command references
- [x] **tests/unit/rule-transformer.test.js**: Update taskmaster.mdc references
- [x] **tests/setup.js**: Update environment variable references

### 6.2 Integration Tests ✅

- [x] **tests/integration/cli/commands.test.js**: Update command names (No changes needed - no Task Master references found)
- [x] **tests/integration/cli/parse-prd-markdown.test.js**: Update references (No changes needed - no Task Master references found)
- [x] **tests/integration/mcp-server/direct-functions.test.js**: Update references (No changes needed - no Task Master references found)

### 6.3 MCP Tests ✅

- [x] **tests/unit/mcp/tools/add-task.test.js**: Update descriptions
- [x] **tests/unit/mcp/tools/initialize-project.test.js**: Update descriptions

### 6.4 E2E Tests ✅

- [x] **tests/e2e/run_e2e.sh**: Update command references
- [x] **tests/e2e/run_fallback_verification.sh**: Update command references
- [x] **tests/e2e/e2e_helpers.sh**: Update command references
- [x] **tests/e2e/parse_llm_output.cjs**: Update report title
- [x] **tests/e2e/run_mcp_inspector.sh**: Update references (No changes needed - no Task Master references found)
- [x] **tests/e2e/test_llm_analysis.sh**: Update references (No changes needed - no Task Master references found)
- [x] **tests/README.md**: Update title and references (Already updated)

### 6.5 Test Fixtures ✅

- [x] **tests/fixtures/*.md**: Update any Task Master references (No changes needed - no Task Master references found)
- [x] **tests/fixtures/*.txt**: Update any Task Master references (No changes needed - no Task Master references found)
- [x] **tests/fixtures/*.js**: Update any references (No changes needed - no Task Master references found)

## Phase 7: Configuration Files

### 7.1 VS Code Configuration

- [ ] **.vscode/launch.json**: Update program paths from `task-master.js` → `lm-tasker.js`

### 7.2 GitHub Templates

- [ ] **.github/ISSUE_TEMPLATE/bug_report.md**: Update "Task Master version" references
- [ ] **.github/ISSUE_TEMPLATE/enhancements---feature-requests.md**: Update command examples
- [ ] **.github/instructions/dev-workflow.instructions.md**: Update all references

### 7.3 Development Files

- [ ] **llms-install.md**: Update all references and examples
- [ ] **mcp-test.js**: Check for references
- [ ] **test-config-manager.js**: Update references

## Phase 8: External Dependencies

### 8.1 GitHub Repository

- [ ] Plan repository rename or new repository creation
- [ ] Update all URL references in code
- [ ] Update issue templates
- [ ] Update repository description

### 8.2 NPM Package

- [ ] Reserve `lm-tasker` package name on NPM
- [ ] Plan publication strategy
- [ ] Update installation instructions
- [ ] Consider deprecation notice for old package

## Phase 9: Migration Support

### 9.1 User Migration

- [ ] Create migration guide for existing users
- [ ] Document MCP configuration changes needed
- [ ] Document shell alias updates needed
- [ ] Document config file migration (`.taskmasterconfig` → `.lmtaskerconfig`)

### 9.2 Backwards Compatibility

- [ ] Consider temporary compatibility layer
- [ ] Plan deprecation timeline for old commands
- [ ] Create clear communication about changes

## Phase 10: Final Validation

### 10.1 Functionality Testing

- [ ] Test all CLI commands work with new names
- [ ] Test MCP server functionality
- [ ] Test configuration file loading
- [ ] Test project initialization

### 10.2 Documentation Review

- [ ] Verify all documentation is consistent
- [ ] Check all command examples work
- [ ] Verify MCP configuration examples
- [ ] Test installation instructions

### 10.3 Package Testing

- [ ] Test local installation
- [ ] Test global installation
- [ ] Test MCP server installation via npx
- [ ] Test all binary commands are accessible

## 🚨 Critical Notes

1. **Breaking Changes**: This is a major breaking change requiring user action
2. **Coordination**: Affects package distribution, GitHub, documentation, and MCP configs
3. **Testing**: Thoroughly test each phase before proceeding
4. **Communication**: Plan user communication strategy for the change

## 📋 Completion Checklist

- [x] Phase 1: Core Package Identity
- [x] Phase 2: Configuration System  
- [x] Phase 3: User Interface & Display
- [x] Phase 4: Documentation
- [x] Phase 5: Code References
- [x] Phase 6: Testing & Validation
- [ ] Phase 7: Configuration Files
- [ ] Phase 8: External Dependencies
- [ ] Phase 9: Migration Support
- [ ] Phase 10: Final Validation

---

**Status**: 🚧 In Progress
**Last Updated**: 2025-01-03
