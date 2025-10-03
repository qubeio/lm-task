# lm-tasker

## 2.2.0

### Major Changes

- **BREAKING**: Removed `lm-tasker init` command completely
- **BREAKING**: Integrated project initialization into `add-task` command

### UX Improvements

- **Auto-initialization**: `add-task` now automatically creates tasks.json and project structure when missing
- **Simplified Workflow**: Single command entry point for new projects - just run `lm-tasker add-task`
- **Seamless Onboarding**: New users can start immediately without separate initialization step

### Changes

- **Backward Compatibility**: Existing projects continue to work unchanged
- **Auto-initialization**: Creates tasks/ directory and minimal tasks.json with proper metadata
- **Updated Documentation**: All docs now reflect the simplified workflow
- **Enhanced User Experience**: Clear messaging when auto-initialization occurs
- **Comprehensive Testing**: Added unit tests for auto-initialization behavior

### Migration Guide

- **For New Projects**: Simply run `lm-tasker add-task` - no initialization needed
- **For Existing Projects**: No changes required - continue using as before
- **If You Used Init**: The init command is no longer available, but add-task handles everything automatically

## 0.17.0

### Major Changes

- **BREAKING**: Removed all AI functionality from LM-Tasker
- **BREAKING**: Removed PRD parsing commands (parse-prd, migrate-prd)
- **BREAKING**: Removed model selection and configuration (models command)
- **BREAKING**: Removed AI provider integrations (OpenAI, Anthropic, Azure, Google, Mistral, Perplexity, XAI, Ollama)
- **BREAKING**: Removed AI services layer and all AI-related configuration
- **BREAKING**: Removed .lmtaskerconfig file system (replaced with hardcoded defaults)
- **BREAKING**: Removed AI-powered task creation and update functionality

### Changes

- Converted to purely manual task management system
- All task operations (add, update, modify) now require manual input
- Simplified configuration system with hardcoded defaults
- Updated CLI help and documentation to reflect manual-only operation
- Removed all AI-related dependencies and environment variables
- Cleaned up code comments and references to AI functionality

### Migration Guide

- If you were using AI-powered features, you'll need to manually create and manage tasks
- Configuration is now simplified - no .lmtaskerconfig file needed
- All existing task data remains compatible
- Use `lm-tasker add-task --title="..." --description="..."` for manual task creation

## 0.15.3

### Patch Changes

- Update logger

## 0.15.2

### Patch Changes

- Update logger

## 0.15.1

### Patch Changes

- Updated logger settings
