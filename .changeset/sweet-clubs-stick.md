---
"@qubeio/lm-tasker": minor
---

**BREAKING**: Remove `lm-tasker init` command and integrate auto-initialization into `add-task`

- **BREAKING**: Completely removed `lm-tasker init` command
- **UX Improvement**: `add-task` now automatically creates tasks.json and project structure when missing
- **Simplified Workflow**: Single command entry point for new projects - just run `lm-tasker add-task`
- **Backward Compatibility**: Existing projects continue to work unchanged
- **Auto-initialization**: Creates tasks/ directory and minimal tasks.json with proper metadata
- **Updated Documentation**: All docs now reflect the simplified workflow
