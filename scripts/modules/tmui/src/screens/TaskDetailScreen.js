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

    // UI Components
    this.parentTaskBox = null;
    this.subtaskList = null;
    this.subtaskDetailBox = null;
    this.statusBar = null;

    this.createComponents();
    this.setupKeyHandlers();
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

    // Parent task information section (top 30% of screen)
    this.parentTaskBox = blessed.box({
      parent: this.container,
      top: 0,
      left: 0,
      width: "100%",
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
      scrollable: true,
      alwaysScroll: true,
      padding: {
        left: 1,
        right: 1,
        top: 0,
        bottom: 0,
      },
    });

    // Subtask list (left side, bottom 70%)
    this.subtaskList = blessed.list({
      parent: this.container,
      top: "30%",
      left: 0,
      width: "50%",
      height: "65%",
      border: {
        type: "line",
      },
      style: {
        border: {
          fg: this.app.theme.border,
        },
        selected: {
          bg: this.app.theme.selectedBg,
          fg: this.app.theme.selectedFg,
        },
      },
      label: " Subtasks ",
      tags: true,
      keys: true,
      vi: true,
      mouse: true,
      scrollable: true,
      alwaysScroll: true,
    });

    // Subtask detail pane (right side, bottom 70%)
    this.subtaskDetailBox = blessed.box({
      parent: this.container,
      top: "30%",
      left: "50%",
      width: "50%",
      height: "65%",
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
      padding: {
        left: 1,
        right: 1,
        top: 0,
        bottom: 0,
      },
    });

    // Status bar (bottom 5%)
    this.statusBar = blessed.box({
      parent: this.container,
      bottom: 0,
      left: 0,
      width: "100%",
      height: 1,
      style: {
        bg: this.app.theme.statusBarBg,
        fg: this.app.theme.statusBarFg,
      },
      tags: true,
      content: " j/k: navigate subtasks | Enter: select | ESC/q: back to list ",
    });

    // Initially hidden
    this.container.hide();
  }

  /**
   * Setup keyboard event handlers for this screen
   */
  setupKeyHandlers() {
    // Navigation within subtasks
    this.container.key(["j", "down"], () => {
      this.moveSubtaskDown();
    });

    this.container.key(["k", "up"], () => {
      this.moveSubtaskUp();
    });

    // Go to first/last subtask
    this.container.key(["g"], () => {
      this.waitForSecondG();
    });

    this.container.key(["G"], () => {
      this.moveToLastSubtask();
    });

    // Return to task list
    this.container.key(["escape", "q"], () => {
      this.app.showTaskList();
    });

    // Enter key - could be used for future subtask actions
    this.container.key(["enter"], () => {
      // For now, just update the detail view
      this.updateSubtaskDetail();
    });
  }

  /**
   * Set the task to display
   */
  setTask(task) {
    this.task = task;
    this.currentSubtaskIndex = 0;
    this.updateDisplay();
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
   * Update the parent task information display
   */
  updateParentTaskDisplay() {
    if (!this.task) return;

    const lines = [];

    // Basic information
    lines.push(`{bold}Status:{/} ${this.getStatusDisplay(this.task.status)}`);
    lines.push(
      `{bold}Priority:{/} ${this.getPriorityDisplay(this.task.priority)}`
    );

    if (this.task.dependencies && this.task.dependencies.length > 0) {
      const depText = this.task.dependencies
        .map((dep) => `[${dep}]`)
        .join(", ");
      lines.push(`{bold}Dependencies:{/} ${depText}`);
    }

    lines.push("");

    // Description
    if (this.task.description) {
      lines.push(`{bold}Description:{/}`);
      lines.push(this.task.description);
      lines.push("");
    }

    // Details
    if (this.task.details) {
      lines.push(`{bold}Details:{/}`);
      lines.push(this.task.details);
      lines.push("");
    }

    // Test Strategy
    if (this.task.testStrategy) {
      lines.push(`{bold}Test Strategy:{/}`);
      lines.push(this.task.testStrategy);
    }

    this.parentTaskBox.setContent(lines.join("\n"));
  }

  /**
   * Update the subtask list
   */
  updateSubtaskList() {
    if (!this.task || !this.task.subtasks || this.task.subtasks.length === 0) {
      this.subtaskList.setItems(["No subtasks"]);
      this.subtaskList.setLabel(" Subtasks (0) ");
      this.subtaskDetailBox.setContent("No subtasks available for this task.");
      return;
    }

    const subtaskItems = this.task.subtasks.map((subtask) => {
      const statusIcon = this.getStatusIcon(subtask.status);
      const priorityColor = this.getPriorityColor(subtask.priority);
      return `${statusIcon} ${String(this.task.id)}.${String(subtask.id)}. ${subtask.title}`;
    });

    this.subtaskList.setItems(subtaskItems);
    this.subtaskList.setLabel(` Subtasks (${this.task.subtasks.length}) `);

    // Select the current subtask
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
    if (!subtask) return;

    const lines = [];

    // Subtask header
    lines.push(
      `{bold}Subtask ${String(this.task.id)}.${String(subtask.id)} - ${subtask.title}{/}`
    );
    lines.push("");

    // Status and priority
    lines.push(`{bold}Status:{/} ${this.getStatusDisplay(subtask.status)}`);
    if (subtask.priority) {
      lines.push(
        `{bold}Priority:{/} ${this.getPriorityDisplay(subtask.priority)}`
      );
    }

    // Dependencies
    if (subtask.dependencies && subtask.dependencies.length > 0) {
      const depText = subtask.dependencies.map((dep) => `${dep}`).join(", ");
      lines.push(`{bold}Dependencies:{/} ${depText}`);
    } else {
      lines.push(`{bold}Dependencies:{/} None`);
    }

    lines.push("");

    // Description
    if (subtask.description) {
      lines.push(`{bold}Description:{/}`);
      // Split long lines for better wrapping
      const descLines = this.wrapText(subtask.description, 60);
      lines.push(...descLines);
      lines.push("");
    }

    // Details
    if (subtask.details) {
      lines.push(`{bold}Details:{/}`);
      // Split long lines for better wrapping
      const detailLines = this.wrapText(subtask.details, 60);
      lines.push(...detailLines);
      lines.push("");
    }

    // Test Strategy
    if (subtask.testStrategy) {
      lines.push(`{bold}Test Strategy:{/}`);
      const testLines = this.wrapText(subtask.testStrategy, 60);
      lines.push(...testLines);
    }

    this.subtaskDetailBox.setContent(lines.join("\n"));

    // Create a responsive label that adapts to terminal width
    const subtaskId = `${String(this.task.id)}.${String(subtask.id)}`;
    const availableWidth = this.subtaskDetailBox.width - 4; // Account for borders and padding
    const fullLabel = ` Subtask ${subtaskId} Details `;
    const shortLabel = ` ${subtaskId} `;

    // Use shorter label if the full one would be too long
    const label = fullLabel.length <= availableWidth ? fullLabel : shortLabel;
    this.subtaskDetailBox.setLabel(label);
  }

  /**
   * Wrap text to specified width
   */
  wrapText(text, width) {
    if (!text || typeof text !== "string") return [];

    const lines = text.split("\n");
    const wrappedLines = [];

    for (const line of lines) {
      if (line.trim() === "") {
        wrappedLines.push("");
        continue;
      }

      if (line.length <= width) {
        wrappedLines.push(line);
      } else {
        // Simple word-based wrapping
        const words = line.trim().split(/\s+/);
        let currentLine = "";

        for (const word of words) {
          if (!word) continue; // Skip empty words

          if (currentLine === "") {
            currentLine = word;
          } else if ((currentLine + " " + word).length <= width) {
            currentLine += " " + word;
          } else {
            wrappedLines.push(currentLine);
            currentLine = word;
          }
        }

        if (currentLine) {
          wrappedLines.push(currentLine);
        }
      }
    }

    return wrappedLines;
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
   * Get status display with icon
   */
  getStatusDisplay(status) {
    const icon = this.getStatusIcon(status);
    return `${icon} ${status}`;
  }

  /**
   * Get priority display with color
   */
  getPriorityDisplay(priority) {
    switch (priority) {
      case "high":
        return `{red-fg}${priority}{/}`;
      case "medium":
        return `{yellow-fg}${priority}{/}`;
      case "low":
        return `{green-fg}${priority}{/}`;
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
        return "✅";
      case "in-progress":
        return "🔄";
      case "pending":
        return "⏳";
      case "blocked":
        return "🚫";
      case "cancelled":
        return "❌";
      case "deferred":
        return "⏸️";
      default:
        return "⏳";
    }
  }

  /**
   * Show the screen
   */
  show() {
    this.container.show();
    this.focus();
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
    this.container.focus();
  }
}
