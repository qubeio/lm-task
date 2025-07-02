# LM-Tasker Design Document

## Overview

This document outlines the design and implementation plan for a Terminal User Interface (TUI) for LM-Tasker, inspired by
tools like K9s. The TUI will provide an interactive, keyboard-driven interface for managing TasLM-Taskersks.

## Goals & Requirements

### Primary Goals

- **CLI Integration**: TUI should leverage existing CLI commands under the hood
- **Vim-like Navigation**: Support standard Vim keybindings for navigation
- **Search Functionality**: Forward slash (/) search similar to Vim/Less
- **Task Management**: View, navigate, and interact with tasks efficiently
- **Performance**: Handle large task lists smoothly
- **Consistency**: Match existing LM-Tasker CLI output formats where possible

### MVP Requirements

1. Launch with `ui` command
2. Display task list in same format as `lm-tasker list`
3. Vim navigation keys (j/k for up/down, gg/G for top/bottom)
4. Forward slash search with highlighting
5. Enter key to view task details (`lm-tasker show <id>`)
6. Quit with 'q' key

### Future Features (Post-MVP)

- Task status updates within TUI
- Multi-panel views (task list + details)
- Filtering by status/priority
- Real-time updates
- Task creation/editing
- Subtask navigation

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   TUI Frontend  │    │  CLI Adapter    │    │  LM-Tasker CLI │
│  (Blessed.js)   │◄──►│   (Internal)    │◄──►│   Commands      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Structure

```
ui/
├── src/
│   ├── index.js           # Entry point, command registration
│   ├── app.js             # Main TUI application
│   ├── screens/
│   │   ├── TaskListScreen.js    # Main task list view
│   │   ├── TaskDetailScreen.js  # Task detail view
│   │   └── SearchScreen.js      # Search overlay
│   ├── components/
│   │   ├── TaskTable.js         # Task list table component
│   │   ├── StatusBar.js         # Bottom status bar
│   │   └── SearchBox.js         # Search input component
│   ├── utils/
│   │   ├── cliAdapter.js        # CLI command interface
│   │   ├── keyHandlers.js       # Keyboard event handling
│   │   └── taskFormatter.js     # Format task data for display
│   └── styles/
│       └── theme.js             # Color themes and styling
```

## Technology Stack

### Primary Library: Blessed.js

**Rationale**: Based on research, Blessed is the most comprehensive TUI library for Node.js with:

- Mature, stable codebase (16k+ lines)
- High-performance rendering with CSR and BCE optimization
- Extensive widget library (tables, forms, layouts)
- Excellent keyboard handling
- DOM-like API for familiar development

### Alternative Considered: Ink

- React-based approach
- Good for React developers
- Less performance-optimized for large datasets
- **Decision**: Blessed chosen for performance and widget maturity

## User Interface Design

### Screen Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ LM-Tasker v1.0.0                                    [96 tasks] │
├─────────────────────────────────────────────────────────────────────┤
│ ID │ Status    │ Priority │ Title                                   │
├────┼───────────┼──────────┼─────────────────────────────────────────┤
│ 1  │ ✅ done   │ high     │ Initialize project structure            │
│ 2  │ ⏳ pending│ medium   │ Set up authentication system            │
│ 3  │ 🔄 in-prog│ high     │ Implement user dashboard               │
│ 4  │ ⏳ pending│ low      │ Add logging functionality              │
│ 5  │ ⏳ pending│ medium   │ Write API documentation                │
├─────────────────────────────────────────────────────────────────────┤
│ j/k: up/down │ /: search │ Enter: details │ q: quit │ ?: help      │
└─────────────────────────────────────────────────────────────────────┘
```

### Search Overlay

```
┌─────────────────────────────────────────────────────────────────────┐
│ Search: auth_____                                                   │
├─────────────────────────────────────────────────────────────────────┤
│ ID │ Status    │ Priority │ Title                                   │
├────┼───────────┼──────────┼─────────────────────────────────────────┤
│ 2  │ ⏳ pending│ medium   │ Set up [auth]entication system         │
│ 15 │ ⏳ pending│ low      │ Add [auth]orization middleware         │
├─────────────────────────────────────────────────────────────────────┤
│ ESC: close search │ Enter: select │ n/N: next/prev match           │
└─────────────────────────────────────────────────────────────────────┘
```

### Task Detail View

```
┌─────────────────────────────────────────────────────────────────────┐
│ Task #2: Set up authentication system                              │
├─────────────────────────────────────────────────────────────────────┤
│ Status: pending                                                     │
│ Priority: medium                                                    │
│ Dependencies: [1] ✅                                               │
│                                                                     │
│ Description:                                                        │
│ Implement JWT-based authentication system with user registration,   │
│ login, and session management.                                      │
│                                                                     │
│ Details:                                                            │
│ - Set up JWT token generation and validation                        │
│ - Create user registration endpoint                                 │
│ - Implement login/logout functionality                              │
│ - Add middleware for protected routes                               │
│                                                                     │
│ Test Strategy:                                                      │
│ - Unit tests for authentication functions                           │
│ - Integration tests for auth endpoints                              │
│ - Manual testing of login flow                                     │
├─────────────────────────────────────────────────────────────────────┤
│ ESC/q: back to list │ u: update status │ e: edit │ ?: help         │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Bindings

### Navigation

- `j` / `↓`: Move down one row
- `k` / `↑`: Move up one row
- `h` / `←`: Scroll left (if content is wide)
- `l` / `→`: Scroll right (if content is wide)
- `gg`: Go to first task
- `G`: Go to last task
- `Ctrl+f` / `Page Down`: Page down
- `Ctrl+b` / `Page Up`: Page up

### Actions

- `Enter`: View task details
- `/`: Start search
- `n`: Next search result
- `N`: Previous search result
- `r`: Refresh task list
- `q`: Quit application
- `?`: Show help

### Search Mode

- `ESC`: Exit search mode
- `Enter`: Select highlighted task
- `Ctrl+c`: Cancel search

### Detail View

- `ESC` / `q`: Return to task list
- `u`: Update task status (future)
- `e`: Edit task (future)

## CLI Integration

### CLI Adapter Interface

```javascript
class CliAdapter {
  async getTasks(options = {}) {
    // Executes: lm-tasker list --json
    // Returns parsed JSON task data
  }

  async getTask(id) {
    // Executes: lm-tasker show <id> --json
    // Returns parsed task details
  }

  async updateTaskStatus(id, status) {
    // Executes: lm-tasker set-status --id=<id> --status=<status>
    // Returns success/error
  }

  async searchTasks(query) {
    // Client-side filtering for MVP
    // Future: could add --search flag to CLI
  }
}
```

### JSON Output Format

Existing CLI commands need `--json` flag support to return structured data:

```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Initialize project structure",
      "status": "done",
      "priority": "high",
      "dependencies": [],
      "description": "...",
      "details": "...",
      "testStrategy": "..."
    }
  ],
  "stats": {
    "total": 96,
    "completed": 53,
    "inProgress": 1,
    "pending": 42
  }
}
```

## Implementation Phases

### Phase 1: MVP Foundation

**Timeline**: 1-2 weeks **Deliverables**:

- Basic Blessed.js setup with `ui` command
- Task list display matching `tm list` format
- Basic keyboard navigation (j/k, Enter, q)
- CLI adapter for `lm-tasker list` and `lm-tasker show`

### Phase 2: Search & Navigation

**Timeline**: 1 week **Deliverables**:

- Forward slash search with highlighting
- Advanced navigation (gg, G, page up/down)
- Search result navigation (n/N)
- Status bar with help hints

### Phase 3: Enhanced UI

**Timeline**: 1 week **Deliverables**:

- Improved task detail view layout
- Status indicators with emojis/colors
- Better error handling and loading states
- Theme/color customization

### Phase 4: Interactive Features (Post-MVP)

**Timeline**: 2-3 weeks **Deliverables**:

- Task status updates from TUI
- Real-time task list updates
- Task creation/editing forms
- Multi-panel layouts

## Technical Considerations

### Performance

- **Lazy Loading**: Only render visible table rows for large task lists
- **Debounced Search**: Prevent excessive filtering during search typing
- **Efficient Re-rendering**: Use Blessed's optimized rendering to minimize screen updates

### Error Handling

- **CLI Command Failures**: Graceful degradation if underlying CLI commands fail
- **Invalid Task IDs**: Handle cases where tasks are deleted between list and detail views
- **Terminal Resize**: Responsive layout adjustments

### Testing Strategy

- **Unit Tests**: CLI adapter functions, key handlers, formatters
- **Integration Tests**: Full TUI workflow simulation
- **Manual Testing**: Keyboard navigation, search functionality, edge cases

## Security Considerations

- **Command Injection**: Sanitize any user input passed to CLI commands
- **Path Traversal**: Validate task IDs and file paths
- **Resource Limits**: Prevent excessive memory usage with large task lists

## Future Enhancements

### Advanced Features

- **Task Dependency Visualization**: ASCII art dependency graphs
- **Bulk Operations**: Multi-select for status updates
- **Task Templates**: Quick task creation from templates
- **Custom Views**: User-defined task filters and layouts
- **Plugin System**: Extensible architecture for custom screens

### Integration Features

- **Git Integration**: Show git branch/commit info for tasks
- **Time Tracking**: Built-in time tracking per task
- **Export Options**: Export filtered task lists to various formats
- **Collaboration**: Multi-user task assignment and comments

## Configuration

### Config File: `.lmtaskerconfig`

```json
{
  "tui": {
    "theme": "default",
    "keyBindings": "vim",
    "refreshInterval": 30,
    "pageSize": 20,
    "showStatusEmojis": true,
    "defaultSort": "id",
    "searchHighlight": true
  }
}
```

### Environment Variables

- `UI_THEME`: Override theme (dark, light, custom)
- `UI_REFRESH_INTERVAL`: Auto-refresh interval in seconds
- `UI_PAGE_SIZE`: Number of tasks per page

## Conclusion

This design provides a solid foundation for building a powerful, efficient TUI for LM-Tasker. The phased approach allows
for iterative development and user feedback, while the CLI integration ensures consistency with existing LM-Tasker
functionality.

The choice of Blessed.js provides the necessary performance and features for a professional TUI experience, while the
modular architecture allows for future enhancements and maintenance.
