/**
 * Task Detail Screen
 * Screen component for displaying detailed task information with navigable subtasks
 */

import blessed from "blessed";

export class TaskDetailScreen {
  constructor(app) {
    this.app = app;
    this.container = null;
    this.task = null;
    this.currentSubtaskIndex = 0;
    this.focusedComponent = "subtasks"; // Track focus state: 'subtasks' or 'parentTask'

    // UI Components
    this.parentTaskBox = null;
    this.subtaskList = null;
    this.subtaskDetailBox = null;
    this.statusBar = null;

    this.createComponents();
    this.setupKeyHandlers();
    this.attachResizeHandler();
  }

  /**
   * Create the screen components
   */
  createComponents() {
    // Main container
    this.container = blessed.box({
      parent: this.app.screen,
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      hidden: true,
      border: {
        type: "line",
      },
      style: {
        border: {
          fg: this.app.theme.border,
        },
      },
      label: " Task Details ",
      tags: true,
      keys: true,
      vi: true,
    });

    // Parent task information section (top portion)
    this.parentTaskBox = blessed.box({
      parent: this.container,
      top: 0,
      left: 0,
      width: "98%", // leave space for the border and scrollbar
      height: "30%",
      border: {
        type: "line",
      },
      style: {
        border: {
          fg: this.app.theme.border,
        },
      },
      label: " Parent Task ",
      tags: true,
      keys: true,
      input: true,
      scrollable: true,
      alwaysScroll: true,
      scrollbar: {
        ch: " ",
        inverse: true,
        style: {
          bg: this.app.theme.selected || "blue",
        },
        track: {
          bg: this.app.theme.border || "grey",
        },
      },
      padding: {
        left: 1,
        right: 1,
      },
    });

    // Subtask list (left side, bottom portion)
    this.subtaskList = blessed.list({
      parent: this.container,
      top: "30%",
      left: 0,
      width: "49%",
      height: "60%",
      border: {
        type: "line",
      },
      style: {
        border: {
          fg: this.app.theme.border,
        },
        item: {
          fg: this.app.theme.text,
        },
        selected: {
          bg: this.app.theme.selected,
          fg: this.app.theme.selectedText,
        },
      },
      label: " Subtasks ",
      tags: true,
      keys: true,
      vi: true,
      mouse: true,
      scrollable: true,
      alwaysScroll: true,
      // padding: {
      //   right: 1,
      // },
      wrap: true,
    });

    // Handle subtask list selection changes
    this.subtaskList.on("select", (item, index) => {
      if (
        this.task &&
        this.task.subtasks &&
        index >= 0 &&
        index < this.task.subtasks.length
      ) {
        this.currentSubtaskIndex = index;
        this.updateSubtaskDetail();
      }
    });

    // Subtask detail pane (right side, bottom portion)
    this.subtaskDetailBox = blessed.box({
      parent: this.container,
      top: "30%",
      left: "50%",
      width: "49%",
      height: "60%",
      border: {
        type: "line",
      },
      style: {
        border: {
          fg: this.app.theme.border,
        },
      },
      label: " Subtask Details ",
      tags: true,
      scrollable: true,
      alwaysScroll: true,
      wrap: true,
      // padding: {
      //   left: 1,
      //   right: 1,
      //   top: 0,
      //   bottom: 0,
      // },
    });

    // Status bar (bottom, above search box)
    this.statusBar = blessed.box({
      parent: this.container,
      bottom: 2, // Position above the search box (which has height 3)
      left: 0,
      width: "100%",
      height: 1,
      style: {
        bg: this.app.theme.statusBarBg,
        fg: this.app.theme.statusBarFg,
      },
      tags: true,
      content:
        " j/k: navigate subtasks | s: update status | 1: parent task | 2: subtasks | ESC/q: back to list ",
    });
  }

  /**
   * Setup keyboard event handlers for this screen
   */
  setupKeyHandlers() {
    // Navigation within subtasks (default mode)
    this.container.key(["j", "down"], () => {
      if (this.focusedComponent === "parentTask") {
        // Scroll parent task box down
        this.parentTaskBox.scroll(1);
        this.app.render();
      } else {
        // Navigate subtasks
        this.moveSubtaskDown();
      }
    });

    this.container.key(["k", "up"], () => {
      if (this.focusedComponent === "parentTask") {
        // Scroll parent task box up
        this.parentTaskBox.scroll(-1);
        this.app.render();
      } else {
        // Navigate subtasks
        this.moveSubtaskUp();
      }
    });

    // Number keys for switching focus between panes
    this.container.key(["1"], () => {
      this.focusParentTask();
    });

    this.container.key(["2"], () => {
      this.focusSubtasks();
    });

    // Go to first/last subtask (only when subtasks are focused)
    this.container.key(["g"], () => {
      if (this.focusedComponent === "subtasks") {
        this.waitForSecondG();
      }
    });

    this.container.key(["G"], () => {
      if (this.focusedComponent === "subtasks") {
        this.moveToLastSubtask();
      }
    });

    // Return to task list
    this.container.key(["escape", "q"], () => {
      this.app.showTaskList();
    });

    // Enter key - could be used for future subtask actions
    this.container.key(["enter"], () => {
      if (this.focusedComponent === "subtasks") {
        // For now, just update the detail view
        this.updateSubtaskDetail();
      }
    });

    // Status update
    this.container.key(["s"], () => {
      this.showStatusUpdate();
    });

    // Setup subtask list key handlers
    this.subtaskList.key(["j", "down"], () => {
      if (this.focusedComponent === "subtasks") {
        this.moveSubtaskDown();
      }
    });

    this.subtaskList.key(["k", "up"], () => {
      if (this.focusedComponent === "subtasks") {
        this.moveSubtaskUp();
      }
    });

    this.subtaskList.key(["1"], () => {
      this.focusParentTask();
    });

    this.subtaskList.key(["2"], () => {
      this.focusSubtasks();
    });

    this.subtaskList.key(["g"], () => {
      if (this.focusedComponent === "subtasks") {
        this.waitForSecondG();
      }
    });

    this.subtaskList.key(["G"], () => {
      if (this.focusedComponent === "subtasks") {
        this.moveToLastSubtask();
      }
    });

    this.subtaskList.key(["escape", "q"], () => {
      this.app.showTaskList();
    });

    this.subtaskList.key(["enter"], () => {
      if (this.focusedComponent === "subtasks") {
        this.updateSubtaskDetail();
      }
    });

    this.subtaskList.key(["s"], () => {
      this.showStatusUpdate();
    });

    // Setup parent task box key handlers
    this.parentTaskBox.key(["j", "down"], () => {
      if (this.focusedComponent === "parentTask") {
        this.parentTaskBox.scroll(1);
        this.app.render();
      }
    });

    this.parentTaskBox.key(["k", "up"], () => {
      if (this.focusedComponent === "parentTask") {
        this.parentTaskBox.scroll(-1);
        this.app.render();
      }
    });

    this.parentTaskBox.key(["1"], () => {
      this.focusParentTask();
    });

    this.parentTaskBox.key(["2"], () => {
      this.focusSubtasks();
    });

    this.parentTaskBox.key(["escape", "q"], () => {
      this.app.showTaskList();
    });

    this.parentTaskBox.key(["s"], () => {
      this.showStatusUpdate();
    });
  }

  /**
   * Set the task to display
   */
  setTask(task) {
    this.task = task;
    this.currentSubtaskIndex = 0;

    // Reset scroll positions and focus state when switching tasks
    this.resetViewState();

    this.updateDisplay();
  }

  /**
   * Reset the view state when switching tasks
   */
  resetViewState() {
    // Reset parent task box scroll position
    if (this.parentTaskBox) {
      this.parentTaskBox.scrollTo(0);
    }

    // Reset subtask detail box scroll position
    if (this.subtaskDetailBox) {
      this.subtaskDetailBox.scrollTo(0);
    }

    // Reset focus to subtasks (default state)
    this.focusedComponent = "subtasks";
  }

  /**
   * Update the entire display with task information
   */
  updateDisplay() {
    if (!this.task) return;

    this.updateParentTaskDisplay();
    this.updateSubtaskList();
    this.updateSubtaskDetail();
    this.container.setLabel(` Task #${this.task.id}: ${this.task.title} `);
  }

  /**
   * Update the parent task display
   */
  updateParentTaskDisplay() {
    if (!this.task) return;

    const lines = [];

    // Basic information
    lines.push(`{bold}Status:{/bold} ${this.task.status}`);
    lines.push(
      `{bold}Priority:{/bold} ${this.getPriorityDisplay(this.task.priority)}`
    );

    if (this.task.dependencies && this.task.dependencies.length > 0) {
      const depText = this.task.dependencies
        .map((dep) => `[${dep}]`)
        .join(", ");
      lines.push(`{bold}Dependencies:{/bold} ${depText}`);
    }

    lines.push("");

    // Description
    if (this.task.description) {
      lines.push(`{bold}Description:{/bold}`);
      lines.push(this.task.description);
      lines.push("");
    }

    // Details
    if (this.task.details) {
      lines.push(`{bold}Details:{/bold}`);
      lines.push(this.task.details);
      lines.push("");
    }

    // Test Strategy
    if (this.task.testStrategy) {
      lines.push(`{bold}Test Strategy:{/bold}`);
      lines.push(this.task.testStrategy);
    }

    const wrappedLines = this.wrapLinesToBoxWidth(lines, this.parentTaskBox);
    this.parentTaskBox.setContent(wrappedLines.join("\n").trim());
  }

  /**
   * Helper to truncate list items to box width
   */
  truncateListItem(item, box) {
    let maxWidth = typeof box.width === "number" ? box.width : box.width || 80;
    maxWidth -= 2; // borders
    if (box.padding) {
      maxWidth -= (box.padding.left || 0) + (box.padding.right || 0);
    }
    if (typeof maxWidth !== "number" || maxWidth < 10) maxWidth = 80;
    // Remove blessed tags for length calculation
    const visible = item.replace(/\{[^}]+\}/g, "");
    if (visible.length > maxWidth) {
      // Truncate and add ellipsis
      return item.slice(0, maxWidth - 1) + "…";
    }
    return item;
  }

  /**
   * Update the subtask list
   */
  updateSubtaskList() {
    if (!this.task || !this.task.subtasks || this.task.subtasks.length === 0) {
      this.subtaskList.setItems(["No subtasks"]);
      this.subtaskList.setLabel(" Subtasks (0) ");
      this.subtaskDetailBox.setContent("No subtasks available.");
      return;
    }

    const subtaskItems = this.task.subtasks.map((subtask) => {
      const statusIcon = this.getStatusIcon(subtask.status);
      const item = `${statusIcon} ${String(this.task.id)}.${String(subtask.id)}. ${subtask.title}`;
      return this.truncateListItem(item, this.subtaskList);
    });

    this.subtaskList.setItems(subtaskItems);
    this.subtaskList.setLabel(` Subtasks (${this.task.subtasks.length}) `);

    // Ensure valid subtask index and select it
    this.currentSubtaskIndex = Math.max(
      0,
      Math.min(this.currentSubtaskIndex, this.task.subtasks.length - 1)
    );

    this.subtaskList.select(this.currentSubtaskIndex);
  }

  /**
   * Update the subtask detail pane
   */
  updateSubtaskDetail() {
    if (!this.task || !this.task.subtasks || this.task.subtasks.length === 0) {
      this.subtaskDetailBox.setContent("No subtasks available.");
      this.subtaskDetailBox.setLabel(" Subtask Details ");
      return;
    }

    const subtask = this.task.subtasks[this.currentSubtaskIndex];
    if (!subtask) {
      this.subtaskDetailBox.setContent("Subtask not found.");
      return;
    }

    const lines = [];

    // Subtask header
    lines.push(
      `{bold}Subtask ${String(this.task.id)}.${String(subtask.id)} - ${subtask.title}{/bold}`
    );
    lines.push("");

    // Status and priority
    lines.push(`{bold}Status:{/bold} ${subtask.status}`);
    if (subtask.priority) {
      lines.push(
        `{bold}Priority:{/bold} ${this.getPriorityDisplay(subtask.priority)}`
      );
    }

    // Dependencies
    if (subtask.dependencies && subtask.dependencies.length > 0) {
      const depText = subtask.dependencies.map((dep) => `${dep}`).join(", ");
      lines.push(`{bold}Dependencies:{/bold} ${depText}`);
    } else {
      lines.push(`{bold}Dependencies:{/bold} None`);
    }

    lines.push("");

    // Description
    if (subtask.description) {
      lines.push(`{bold}Description:{/bold}`);
      lines.push(subtask.description);
      lines.push("");
    }

    // Details
    if (subtask.details) {
      lines.push(`{bold}Details:{/bold}`);
      lines.push(subtask.details);
      lines.push("");
    }

    // Test Strategy
    if (subtask.testStrategy) {
      lines.push(`{bold}Test Strategy:{/bold}`);
      lines.push(subtask.testStrategy);
    }

    const wrappedLines = this.wrapLinesToBoxWidth(lines, this.subtaskDetailBox);
    this.subtaskDetailBox.setContent(wrappedLines.join("\n").trim());

    // Set label
    const subtaskId = `${String(this.task.id)}.${String(subtask.id)}`;
    this.subtaskDetailBox.setLabel(` Subtask ${subtaskId} Details `);
  }

  /**
   * Move to next subtask
   */
  moveSubtaskDown() {
    if (!this.task || !this.task.subtasks || this.task.subtasks.length === 0)
      return;

    if (this.currentSubtaskIndex < this.task.subtasks.length - 1) {
      this.currentSubtaskIndex++;
      this.subtaskList.select(this.currentSubtaskIndex);
      this.updateSubtaskDetail();
      this.app.render();
    }
  }

  /**
   * Move to previous subtask
   */
  moveSubtaskUp() {
    if (!this.task || !this.task.subtasks || this.task.subtasks.length === 0)
      return;

    if (this.currentSubtaskIndex > 0) {
      this.currentSubtaskIndex--;
      this.subtaskList.select(this.currentSubtaskIndex);
      this.updateSubtaskDetail();
      this.app.render();
    }
  }

  /**
   * Move to first subtask
   */
  moveToFirstSubtask() {
    if (!this.task || !this.task.subtasks || this.task.subtasks.length === 0)
      return;

    this.currentSubtaskIndex = 0;
    this.subtaskList.select(this.currentSubtaskIndex);
    this.updateSubtaskDetail();
    this.app.render();
  }

  /**
   * Move to last subtask
   */
  moveToLastSubtask() {
    if (!this.task || !this.task.subtasks || this.task.subtasks.length === 0)
      return;

    this.currentSubtaskIndex = this.task.subtasks.length - 1;
    this.subtaskList.select(this.currentSubtaskIndex);
    this.updateSubtaskDetail();
    this.app.render();
  }

  /**
   * Wait for second 'g' to complete 'gg' command
   */
  waitForSecondG() {
    const timeout = setTimeout(() => {
      this.container.removeListener("keypress", secondGHandler);
    }, 500);

    const secondGHandler = (ch, key) => {
      if (key && key.name === "g") {
        clearTimeout(timeout);
        this.container.removeListener("keypress", secondGHandler);
        this.moveToFirstSubtask();
      } else {
        clearTimeout(timeout);
        this.container.removeListener("keypress", secondGHandler);
      }
    };

    this.container.once("keypress", secondGHandler);
  }

  /**
   * Get priority display with color
   */
  getPriorityDisplay(priority) {
    switch (priority) {
      case "high":
        return `{red-fg}${priority}{/red-fg}`;
      case "medium":
        return `{yellow-fg}${priority}{/yellow-fg}`;
      case "low":
        return `{green-fg}${priority}{/green-fg}`;
      default:
        return priority || "medium";
    }
  }

  /**
   * Get priority color for styling
   */
  getPriorityColor(priority) {
    switch (priority) {
      case "high":
        return "red";
      case "medium":
        return "yellow";
      case "low":
        return "green";
      default:
        return "white";
    }
  }

  /**
   * Get status icon
   */
  getStatusIcon(status) {
    switch (status) {
      case "done":
        return "{green-fg}[✓]{/green-fg}";
      case "in-progress":
        return "{blue-fg}[~]{/blue-fg}";
      case "pending":
        return "{yellow-fg}[.]{/yellow-fg}";
      case "blocked":
        return "{red-fg}[X]{/red-fg}";
      case "cancelled":
        return "{gray-fg}[!]{/gray-fg}";
      case "deferred":
        return "{magenta-fg}[-]{/magenta-fg}";
      default:
        return "{yellow-fg}[.]{/yellow-fg}";
    }
  }

  /**
   * Update status bar for subtask navigation mode
   */
  updateStatusBarForSubtasks() {
    this.statusBar.setContent(
      " j/k: navigate subtasks | s: update status | 1: parent task | 2: subtasks | ESC/q: back to list "
    );
  }

  /**
   * Update status bar for parent task scrolling mode
   */
  updateStatusBarForParentTask() {
    this.statusBar.setContent(
      " j/k: scroll parent task | s: update status | 1: parent task | 2: subtasks | ESC/q: back to list "
    );
  }

  /**
   * Focus the parent task box
   */
  focusParentTask() {
    this.focusedComponent = "parentTask";
    this.subtaskList.style.border.fg = this.app.theme.border;
    this.parentTaskBox.style.border.fg = this.app.theme.selected;
    this.parentTaskBox.focus();
    this.updateStatusBarForParentTask();
    if (!this.container.hidden) {
      this.app.render();
    }
  }

  /**
   * Focus the subtasks list
   */
  focusSubtasks() {
    this.focusedComponent = "subtasks";
    this.parentTaskBox.style.border.fg = this.app.theme.border;
    this.subtaskList.style.border.fg = this.app.theme.selected;
    this.subtaskList.focus();
    this.updateStatusBarForSubtasks();
    if (!this.container.hidden) {
      this.app.render();
    }
  }

  /**
   * Show status update modal for the current context (parent task or subtask)
   */
  showStatusUpdate() {
    if (this.focusedComponent === "parentTask") {
      // Update parent task status
      if (this.task) {
        this.app.statusModal.show(this.task, async (newStatus) => {
          await this.updateTaskStatus(this.task.id, newStatus);
        });
      }
    } else {
      // Update subtask status
      if (this.task && this.task.subtasks && this.task.subtasks.length > 0) {
        const currentSubtask = this.task.subtasks[this.currentSubtaskIndex];
        if (currentSubtask) {
          // Create a task-like object for the subtask
          const subtaskForModal = {
            id: `${this.task.id}.${currentSubtask.id}`,
            title: currentSubtask.title,
            status: currentSubtask.status,
          };

          this.app.statusModal.show(subtaskForModal, async (newStatus) => {
            await this.updateTaskStatus(
              `${this.task.id}.${currentSubtask.id}`,
              newStatus
            );
          });
        }
      }
    }
  }

  /**
   * Update task or subtask status and refresh the display
   */
  async updateTaskStatus(taskId, newStatus) {
    try {
      // Update via CLI adapter
      await this.app.cliAdapter.updateTaskStatus(taskId, newStatus);

      // Refresh the task data
      const updatedTask = await this.app.cliAdapter.getTask(this.task.id);
      this.setTask(updatedTask);

      // Show success message (we'll add a simple message display)
      this.showStatusMessage(`Task ${taskId} status updated to ${newStatus}!`);
    } catch (error) {
      this.app.showError(`Failed to update task status: ${error.message}`);
    }
  }

  /**
   * Show a temporary status message
   */
  showStatusMessage(message) {
    const originalContent = this.statusBar.content;
    this.statusBar.setContent(` ${message} `);
    this.app.render();

    // Restore original content after 2 seconds
    setTimeout(() => {
      if (this.focusedComponent === "parentTask") {
        this.updateStatusBarForParentTask();
      } else {
        this.updateStatusBarForSubtasks();
      }
      this.app.render();
    }, 2000);
  }

  /**
   * Show the screen
   */
  show() {
    this.container.show();
    this.focusSubtasks();
  }

  /**
   * Hide the screen
   */
  hide() {
    this.container.hide();
  }

  /**
   * Focus the screen
   */
  focus() {
    // Default focus to subtasks
    this.focusSubtasks();
  }

  /**
   * Helper to wrap lines to box width, with truncation fallback
   */
  wrapLinesToBoxWidth(lines, box) {
    // Get the actual width in columns (after rendering)
    let maxWidth = typeof box.width === "number" ? box.width : box.width || 80;
    maxWidth -= 2; // for borders
    if (box.padding) {
      maxWidth -= (box.padding.left || 0) + (box.padding.right || 0);
    }
    if (typeof maxWidth !== "number" || maxWidth < 10) maxWidth = 80;
    const wrapped = [];
    for (const line of lines) {
      let l = line;
      // Remove blessed tags for length calculation
      let visible = l.replace(/\{[^}]+\}/g, "");
      while (visible.length > maxWidth) {
        // Try to break at a space if possible
        let breakIdx = visible.lastIndexOf(" ", maxWidth);
        if (breakIdx <= 0) breakIdx = maxWidth;
        wrapped.push(l.slice(0, breakIdx));
        l = l.slice(breakIdx).replace(/^\s+/, "");
        visible = l.replace(/\{[^}]+\}/g, "");
      }
      // Truncate as a final fallback if still too long (e.g., unbreakable word)
      let finalVisible = l.replace(/\{[^}]+\}/g, "");
      if (finalVisible.length > maxWidth) {
        // Truncate and add ellipsis
        wrapped.push(l.slice(0, maxWidth - 1) + "…");
      } else {
        wrapped.push(l);
      }
    }
    return wrapped;
  }

  /**
   * Listen for screen resize and re-render display for wrapping
   */
  attachResizeHandler() {
    if (this.app && this.app.screen) {
      this.app.screen.on("resize", () => {
        this.updateDisplay();
        this.app.render();
      });
    }
  }
}
