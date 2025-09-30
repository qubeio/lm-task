# lm-tasker

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
