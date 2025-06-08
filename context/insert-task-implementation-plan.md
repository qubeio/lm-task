# Insert Task Implementation Plan

## Overview

This document outlines the implementation plan for adding insert task functionality to TaskMaster. The approach uses an
`order` field to control task positioning without renumbering existing task IDs, providing a safe and flexible solution
for task insertion.

## Problem Statement

Currently, TaskMaster only supports appending new tasks to the end of the task list. Users need the ability to insert
tasks at specific positions in the logical flow, but LLMs struggle with the complex renumbering logic required. A
programmatic solution is needed.

## Solution: Order Field Approach

### Core Concept

Instead of renumbering task IDs (which would break references), we introduce an `order` field that controls display and
logical ordering while keeping IDs stable.

### Enhanced Task Model

```json
{
  "id": 5, // Stable, unique identifier (never changes)
  "title": "Task Title",
  "description": "...",
  "status": "pending",
  "dependencies": [1, 2],
  "priority": "high",
  "order": 5.0, // NEW: Controls position in task list
  "details": "...",
  "testStrategy": "..."
}
```

### Key Benefits

1. **Stable IDs**: Task IDs never change, preserving all references
2. **Flexible Positioning**: Support both integer and fractional ordering
3. **Backward Compatible**: Existing tasks work without modification
4. **Simple Logic**: No complex dependency updates needed
5. **Performance**: Minimal data changes required

## Implementation Details

### 1. Schema Updates

#### Task Schema Enhancement

- Add optional `order: z.number()` field to TaskSchema
- Update validation to ensure order values are numeric
- Implement default order assignment (order = id for new tasks)

#### Migration Logic

- Auto-detect tasks without order field
- Assign order values matching current ID-based sequence
- Provide explicit migration command for controlled updates

### 2. Core Functions

#### Insert Task Function

```javascript
// scripts/modules/task-manager/insert-task.js
async function insertTask(tasksPath, insertPosition, prompt, dependencies, priority, context, outputFormat, manualTaskData, useResearch)
```

**Logic:**

1. Read existing tasks
2. Auto-migrate to order field if needed
3. Generate new task using existing AI logic
4. Shift order values for existing tasks (>= insertPosition) by +1
5. Assign new task order = insertPosition
6. Sort tasks by order field
7. Write updated tasks and regenerate files

#### Insert Between Function

```javascript
async function insertTaskBetween(tasksPath, afterPosition, prompt, ...)
```

**Logic:**

1. Find task at afterPosition and next task
2. Calculate fractional order: (afterOrder + nextOrder) / 2
3. Insert new task with fractional order
4. No other tasks need updating

#### Reorder Task Function

```javascript
async function reorderTask(tasksPath, taskId, newPosition)
```

**Logic:**

1. Find task by ID
2. Remove from current position
3. Shift tasks to make space at new position
4. Update task's order field
5. Sort and save

#### Migration Function

```javascript
async function migrateTasksToOrderField(tasksPath)
```

**Logic:**

1. Check if migration needed
2. Assign order = id for all tasks without order field
3. Sort tasks by order
4. Update file

### 3. Display Logic Updates

#### Sorting Function

```javascript
function sortTasksByOrder(tasks) {
  return tasks.sort((a, b) => {
    const orderA = a.order !== undefined ? a.order : a.id;
    const orderB = b.order !== undefined ? b.order : b.id;
    return orderA - orderB;
  });
}
```

#### Updated List Functions

- `list-tasks.js`: Sort by order field
- `find-next-task.js`: Consider order for next task logic
- `generate-task-files.js`: Generate files in order sequence

### 4. CLI Commands

#### New Commands

```bash
# Insert at specific position
task-master insert-task <position> [options]

# Insert between two positions
task-master insert-between <after-position> [options]

# Reorder existing task
task-master reorder-task <task-id> --to-position <position>

# Manual migration
task-master migrate-order
```

#### Command Options

- Same options as `add-task`: `--prompt`, `--title`, `--description`, `--details`, `--dependencies`, `--priority`
- Additional: `--file`, `--research`

### 5. MCP Integration

#### Direct Functions

- `insert-task.js`: Wrapper for insertTask()
- `insert-between.js`: Wrapper for insertTaskBetween()
- `reorder-task.js`: Wrapper for reorderTask()
- `migrate-order.js`: Wrapper for migrateTasksToOrderField()

#### MCP Tools

- `insert_task`: Expose insertTask functionality
- `insert_task_between`: Expose insertTaskBetween functionality
- `reorder_task`: Expose reorderTask functionality
- `migrate_order`: Expose migration functionality

## File Structure

```
scripts/modules/task-manager/
├── insert-task.js          # Core insert functionality
├── insert-between.js       # Insert between positions
├── reorder-task.js        # Reorder existing tasks
├── migrate-order.js       # Migration utilities
└── order-utils.js         # Shared ordering utilities

mcp-server/src/core/direct-functions/
├── insert-task.js         # MCP wrapper for insert
├── insert-between.js      # MCP wrapper for insert-between
├── reorder-task.js        # MCP wrapper for reorder
└── migrate-order.js       # MCP wrapper for migration

mcp-server/src/tools/
├── insert-task.js         # MCP tool definition
├── insert-between.js      # MCP tool definition
├── reorder-task.js        # MCP tool definition
└── migrate-order.js       # MCP tool definition
```

## Implementation Phases

### Phase 1: Core Infrastructure

1. Add order field to task schema
2. Implement migration utilities
3. Update sorting logic in display functions
4. Add order-utils helper functions

### Phase 2: Insert Functionality

1. Implement insert-task core function
2. Implement insert-between core function
3. Add CLI commands for insert operations
4. Create comprehensive tests

### Phase 3: Reordering

1. Implement reorder-task core function
2. Add CLI command for reordering
3. Add validation and error handling
4. Update documentation

### Phase 4: MCP Integration

1. Create direct function wrappers
2. Implement MCP tools
3. Register tools in MCP server
4. Add integration tests

### Phase 5: Polish & Documentation

1. Add comprehensive error handling
2. Update user documentation
3. Add examples and workflows
4. Performance optimization

## Error Handling

### Validation

- Ensure insert position is valid (positive integer)
- Validate task ID exists for reordering
- Check for order field conflicts
- Validate dependencies after reordering

### Error Scenarios

- Insert position beyond task count (auto-adjust)
- Reordering non-existent task (error)
- Migration on already-migrated tasks (skip)
- File system errors (retry logic)

### User Feedback

- Clear success messages showing what was moved
- Summary of order changes made
- Warnings for potential issues
- Helpful error messages with suggested fixes

## Testing Strategy

### Unit Tests

- Order field migration logic
- Insert position calculations
- Fractional ordering edge cases
- Dependency preservation during reordering

### Integration Tests

- Full insert workflow (CLI + file operations)
- MCP tool functionality
- Cross-command interactions
- File generation after ordering changes

### Edge Cases

- Empty task lists
- Single task lists
- Tasks with no order field (mixed state)
- Very large order values
- Fractional precision limits

## Backward Compatibility

### Migration Strategy

1. **Automatic**: First use of insert/reorder triggers migration
2. **Manual**: Explicit command for controlled migration
3. **Gradual**: Teams choose when to adopt ordering features
4. **Fallback**: All existing functionality works without order field

### Compatibility Guarantees

- Existing task IDs never change
- All current CLI commands continue working
- Task files maintain same content format
- Dependencies remain valid
- MCP tools preserve existing behavior

## Performance Considerations

### Optimization Targets

- Minimize file I/O operations
- Efficient sorting algorithms
- Batch order updates when possible
- Smart migration detection

### Scalability

- Support for large task lists (1000+ tasks)
- Efficient order value assignment
- Minimal memory usage during reordering
- Fast file regeneration

## Future Enhancements

### Potential Features

- Bulk reordering operations
- Order templates/presets
- Visual drag-and-drop reordering (TUI)
- Order-based filtering and grouping
- Smart insertion based on dependencies

### Extension Points

- Custom ordering algorithms
- Project-specific ordering rules
- Integration with external project management tools
- Order-based reporting and analytics

## Success Criteria

### Functional Requirements

- ✅ Insert tasks at any position
- ✅ Maintain stable task IDs
- ✅ Preserve all dependencies
- ✅ Support both CLI and MCP interfaces
- ✅ Backward compatibility maintained

### Non-Functional Requirements

- ✅ Fast operation on large task lists
- ✅ Clear user feedback
- ✅ Comprehensive error handling
- ✅ Well-documented functionality
- ✅ Thorough test coverage

## Conclusion

The order field approach provides a robust, safe, and flexible solution for task insertion. It maintains backward
compatibility while enabling powerful new workflows. The phased implementation ensures steady progress and early value
delivery.
