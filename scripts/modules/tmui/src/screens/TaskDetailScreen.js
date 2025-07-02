/**
 * Task Detail Screen
 * Screen component for displaying detailed task information with navigable subtasks
 */

import blessed from "blessed";
import { StatusBar } from "../components/StatusBar.js";
import { logger } from "../utils/logger.js";

export class TaskDetailScreen {
  constructor(app, options = {}) {
    logger.log("TaskDetailScreen constructor called.");
    this.app = app;
    this.options = options; // Store options on the instance
    this.container = null;
    this.task = null;
    this.currentSubtaskIndex = 0;
    this.focusedComponent = "subtasks"; // Track focus state: 'subtasks', 'parentTask', or 'subtaskDetails'

    // UI Components
    this.parentTaskBox = null;
    this.subtaskList = null;
    this.subtaskDetailBox = null;
    this.statusBar = null;

    // Mouse wheel scroll configuration
    this.wheelScrollAmount = 0.5; // Scroll half a line at a time to compensate for double events

    this.createComponents();
    this.setupKeyHandlers();
    this.attachResizeHandler();
  }

  /**
   * Get the container element for this screen
   */
  getContainer() {
    return this.container;
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
      height: this.options.height || "100%",
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
      mouse: true,
      clickable: true,
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
      height: "65%",
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

    // Control mouse wheel scroll amount for subtask list
    this.subtaskList.on("wheeldown", () => {
      this.subtaskList.scroll(this.wheelScrollAmount); // Scroll half a line to compensate for double events
      this.app.render();
      return false; // Prevent default handling
    });

    this.subtaskList.on("wheelup", () => {
      this.subtaskList.scroll(-this.wheelScrollAmount); // Scroll half a line to compensate for double events
      this.app.render();
      return false; // Prevent default handling
    });

    // Subtask detail pane (right side, bottom portion)
    this.subtaskDetailBox = blessed.box({
      parent: this.container,
      top: "30%",
      left: "50%",
      width: "48%",
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
      keys: true,
      input: true,
      scrollable: true,
      alwaysScroll: true,
      wrap: true,
      mouse: true,
      clickable: true,
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

    // Control mouse wheel scroll amount for subtask details
    this.subtaskDetailBox.on("wheeldown", () => {
      this.subtaskDetailBox.scroll(this.wheelScrollAmount); // Scroll half a line to compensate for double events
      this.app.render();
      return false; // Prevent default handling
    });

    this.subtaskDetailBox.on("wheelup", () => {
      this.subtaskDetailBox.scroll(-this.wheelScrollAmount); // Scroll half a line to compensate for double events
      this.app.render();
      return false; // Prevent default handling
    });

    // Status bar (bottom, above search box)
    // The StatusBar component now has a height of 2, so adjust bottom position accordingly
    this.statusBar = new StatusBar(this);
    // The actual blessed widget is accessed via this.statusBar.getWidget()
    // We need to ensure it's positioned correctly, if its parent is this.container
    // The StatusBar constructor sets parent to this.screen.getContainer() which is this.container
    // It also sets bottom to 0 by default. We need to adjust it if there's a search box below.
    // For TaskDetailScreen, there isn't a search box directly managed here like in App.js
    // So, we might need to adjust the container's height or the status bar's position within its own logic if needed.
    // For now, let's assume the StatusBar component handles its positioning correctly relative to its parent.
    // If a search box is added later *below* this screen's container, this might need adjustment.
    // The original TaskDetailScreen status bar was at bottom: 2. Our StatusBar is height 2.
    // If we want it at the very bottom of this.container, its own logic (bottom:0, height:2) is fine.
    // If there was something *below* the status bar within this.container, we'd need to adjust.
    // Let's assume it should be at the absolute bottom of this.container.
    // The StatusBar component itself sets its blessed box to bottom: 0 of its parent.

    // Add click-to-focus handlers
    this.parentTaskBox.on("click", () => {
      this.focusParentTask();
      this.app.render();
    });

    // Control mouse wheel scroll amount
    this.parentTaskBox.on("wheeldown", () => {
      this.parentTaskBox.scroll(this.wheelScrollAmount); // Scroll half a line to compensate for double events
      this.app.render();
      return false; // Prevent default handling
    });

    this.parentTaskBox.on("wheelup", () => {
      this.parentTaskBox.scroll(-this.wheelScrollAmount); // Scroll half a line to compensate for double events
      this.app.render();
      return false; // Prevent default handling
    });

    this.subtaskList.on("click", () => {
      this.focusSubtasks();
      this.app.render();
    });

    this.subtaskDetailBox.on("click", () => {
      this.focusSubtaskDetails();
      this.app.render();
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

    this.container.key(["3"], () => {
      this.focusSubtaskDetails();
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
    this.container.key(["escape", "q", "h"], () => {
      this.app.showTaskList();
    });

    // Enter key - could be used for future subtask actions
    this.container.key(["enter", "l"], () => {
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

    this.subtaskList.key(["3"], () => {
      this.focusSubtaskDetails();
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

    this.subtaskList.key(["escape", "q", "h"], () => {
      this.app.showTaskList();
    });

    this.subtaskList.key(["enter", "l"], () => {
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

    this.parentTaskBox.key(["3"], () => {
      this.focusSubtaskDetails();
    });

    this.parentTaskBox.key(["escape", "q", "h"], () => {
      this.app.showTaskList();
    });

    this.parentTaskBox.key(["s"], () => {
      this.showStatusUpdate();
    });

    // Setup subtask details box key handlers
    this.subtaskDetailBox.key(["j", "down"], () => {
      if (this.focusedComponent === "subtaskDetails") {
        this.subtaskDetailBox.scroll(1);
        this.app.render();
      }
    });

    this.subtaskDetailBox.key(["k", "up"], () => {
      if (this.focusedComponent === "subtaskDetails") {
        this.subtaskDetailBox.scroll(-1);
        this.app.render();
      }
    });

    this.subtaskDetailBox.key(["space"], () => {
      if (this.focusedComponent === "subtaskDetails") {
        this.subtaskDetailBox.scroll(this.subtaskDetailBox.height - 2);
        this.app.render();
      }
    });

    this.subtaskDetailBox.key(["b"], () => {
      if (this.focusedComponent === "subtaskDetails") {
        this.subtaskDetailBox.scroll(-(this.subtaskDetailBox.height - 2));
        this.app.render();
      }
    });

    this.subtaskDetailBox.key(["1"], () => {
      this.focusParentTask();
    });

    this.subtaskDetailBox.key(["2"], () => {
      this.focusSubtasks();
    });

    this.subtaskDetailBox.key(["3"], () => {
      this.focusSubtaskDetails();
    });

    this.subtaskDetailBox.key(["escape", "q", "h"], () => {
      this.app.showTaskList();
    });

    this.subtaskDetailBox.key(["s"], () => {
      this.showStatusUpdate();
    });
  }

  /**
   * Set the task to display
   */
  setTask(task) {
    logger.log(
      `TaskDetailScreen.setTask() called for task ID: ${task ? task.id : "undefined"}.`,
    );
    this.task = task;
    this.currentSubtaskIndex = 0; // Reset to the first subtask
    this.container.show();
    this.updateDisplay();
    this.statusBar.setSecondLine("Placeholder: Task Detail View - Second Line"); // Add this line
    this.focus(); // Focus the default component (subtasks list)
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
    logger.log("TaskDetailScreen.updateDisplay() called.");
    if (!this.task) {
      logger.log("TaskDetailScreen.updateDisplay - no task, returning.");
      return;
    }

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
      `{bold}Priority:{/bold} ${this.getPriorityDisplay(this.task.priority)}`,
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
  /**
   * Helper function to strip emojis from text
   * @param {string} text - Text to strip emojis from
   * @returns {string} - Text with emojis removed
   */
  stripEmojis(text) {
    // Simply return the text as is - we'll handle emoji display differently
    // This ensures we don't accidentally strip out status indicators like checkmarks
    if (!text) return "";
    return text;
  }

  /**
   * Truncate list item text to fit box width
   * @param {string} item - Text to truncate
   * @param {object} box - Box to fit text into
   * @returns {string} - Truncated text
   */
  truncateListItem(item, box) {
    let maxWidth = typeof box.width === "number" ? box.width : box.width || 80;
    maxWidth -= 2; // borders
    if (box.padding) {
      maxWidth -= (box.padding.left || 0) + (box.padding.right || 0);
    }
    if (typeof maxWidth !== "number" || maxWidth < 10) maxWidth = 80;

    // Strip emojis before processing
    const cleanItem = this.stripEmojis(item);

    // Remove blessed tags for length calculation
    const visible = cleanItem.replace(/\{[^}]+\}/g, "");
    if (visible.length > maxWidth) {
      // Truncate and add ellipsis
      return cleanItem.slice(0, maxWidth - 1) + "…";
    }
    return cleanItem;
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
      Math.min(this.currentSubtaskIndex, this.task.subtasks.length - 1),
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
      `{bold}Subtask ${String(this.task.id)}.${String(subtask.id)} - ${subtask.title}{/bold}`,
    );
    lines.push("");

    // Status and priority
    lines.push(`{bold}Status:{/bold} ${subtask.status}`);
    if (subtask.priority) {
      lines.push(
        `{bold}Priority:{/bold} ${this.getPriorityDisplay(subtask.priority)}`,
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
    // StatusBar.updateDisplay() will be called by updateStatusBarContent
    // ensuring the correct dynamic first line is shown.
    this.updateStatusBarContent();
  }

  updateStatusBarContent() {
    // The StatusBar component now handles its own content updates via updateDisplay()
    // We just need to ensure its stats are updated if they are relevant here (they are not currently)
    // and that setSecondLine is called when the screen is shown.
    // If there were dynamic changes to the first line based on TaskDetailScreen state (other than screen type),
    // we might need a new method in StatusBar or pass more context.
    // For now, calling updateDisplay on the statusBar instance will refresh its content based on screen type.
    if (this.statusBar) {
      this.statusBar.updateDisplay();
    }
  }

  /**
   * Update status bar for parent task scrolling mode
   */
  updateStatusBarForParentTask() {
    // StatusBar.updateDisplay() will be called by updateStatusBarContent
    this.updateStatusBarContent();
  }

  /**
   * Update status bar for subtask details scrolling mode
   */
  updateStatusBarForSubtaskDetails() {
    // StatusBar.updateDisplay() will be called by updateStatusBarContent
    this.updateStatusBarContent();
  }

  /**
   * Focus the parent task box
   */
  focusParentTask() {
    this.focusedComponent = "parentTask";
    this.subtaskList.style.border.fg = this.app.theme.border;
    this.subtaskDetailBox.style.border.fg = this.app.theme.border;
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
    this.subtaskDetailBox.style.border.fg = this.app.theme.border;
    this.subtaskList.style.border.fg = this.app.theme.selected;
    this.subtaskList.focus();
    this.updateStatusBarForSubtasks();
    if (!this.container.hidden) {
      this.app.render();
    }
  }

  /**
   * Focus the subtask details box
   */
  focusSubtaskDetails() {
    this.focusedComponent = "subtaskDetails";
    this.parentTaskBox.style.border.fg = this.app.theme.border;
    this.subtaskList.style.border.fg = this.app.theme.border;
    this.subtaskDetailBox.style.border.fg = this.app.theme.selected;
    this.subtaskDetailBox.focus();
    this.updateStatusBarForSubtaskDetails();
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
              newStatus,
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
      // Update via JsonLoader (with fallback to CLI adapter)
      if (this.app.jsonLoader) {
        await this.app.jsonLoader.updateTaskStatus(taskId, newStatus);
      } else {
        await this.app.cliAdapter.updateTaskStatus(taskId, newStatus);
      }

      // Refresh the task data
      let updatedTask;
      if (this.app.jsonLoader) {
        updatedTask = await this.app.jsonLoader.getTask(this.task.id);
      } else {
        updatedTask = await this.app.cliAdapter.getTask(this.task.id);
      }

      this.setTask(updatedTask);

      // Show success message
      this.showStatusMessage(`Task ${taskId} status updated to ${newStatus}!`);
    } catch (error) {
      this.app.showError(`Failed to update task status: ${error.message}`);
    }
  }

  /**
   * Show a temporary status message
   */
  showStatusMessage(message) {
    // Use the StatusBar's setMessage method which handles temporary messages properly
    this.statusBar.setMessage(message, 2000);
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
  /**
   * Wrap lines to fit box width
   * @param {string[]} lines - Lines to wrap
   * @param {object} box - Box to fit lines into
   * @returns {string[]} - Wrapped lines
   */
  wrapLinesToBoxWidth(lines, box) {
    // Get the actual width in columns (after rendering)
    let maxWidth = typeof box.width === "number" ? box.width : box.width || 80;
    maxWidth -= 2; // for borders
    if (box.padding) {
      maxWidth -= (box.padding.left || 0) + (box.padding.right || 0);
    }

    // Reduce width further for subtaskDetailBox to account for scrollbar
    if (box === this.subtaskDetailBox) {
      maxWidth -= 5; // Additional reduction for scrollbar
    }

    if (typeof maxWidth !== "number" || maxWidth < 10) maxWidth = 80;
    const wrapped = [];
    for (const line of lines) {
      // Strip emojis before processing
      let l = this.stripEmojis(line);

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

  // No throttle method needed anymore

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
