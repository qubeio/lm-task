/**
 * Task Table Component
 * Displays tasks in a list format using blessed list widget
 */

import blessed from "blessed";

export class TaskTable {
  constructor(screen) {
    this.screen = screen;
    this.app = screen.app;
    this.container = null;
    this.header = null;
    this.table = null;
    this.tasks = [];
    this.selectedIndex = 0;

    this.createTable();
    this.attachResizeHandler();
  }

  /**
   * Create the list widget with a fixed header
   */
  createTable() {
    this.container = blessed.box({
      parent: this.screen.getContainer(),
      top: 1,
      left: 1,
      width: "98%",
      height: "92%", // Leave space for status bar
      border: {
        type: "line",
      },
      style: {
        border: {
          fg: this.app.theme.border,
        },
      },
      label: " Tasks ",
    });

    this.header = blessed.text({
      parent: this.container,
      top: 0,
      left: 1,
      width: "100%-4",
      height: 1,
      content: this.formatHeader(),
      style: {
        fg: this.app.theme.header,
        bold: true,
        bg: this.app.theme.headerBg || "black",
        underline: true,
      },
      tags: true,
    });

    this.table = blessed.list({
      parent: this.container,
      top: 1,
      left: 0,
      width: "98%",
      height: "95%",
      padding: {
        left: 1,
        right: 1,
      },
      style: {
        item: {
          fg: this.app.theme.text,
        },
        selected: {
          bg: this.app.theme.selected,
          fg: this.app.theme.selectedText,
        },
      },
      scrollable: true,
      alwaysScroll: false,
      scrollbar: {
        ch: " ",
        track: {
          bg: this.app.theme.scrollTrack,
        },
        style: {
          inverse: true,
        },
      },
      keys: true,
      vi: true,
      mouse: true,
      tags: true,
    });

    // Sync app's currentTaskIndex when blessed list selection changes
    this.table.on("select", (item, index) => {
      this.selectedIndex = index;
      // Only update app's currentTaskIndex if it's actually different
      // and we have tasks to avoid sync issues on initial load
      if (
        this.app &&
        this.tasks.length > 0 &&
        this.app.currentTaskIndex !== index
      ) {
        this.app.currentTaskIndex = index;
      }
    });

    // Also listen for key events that change selection to ensure sync
    this.table.on("keypress", (ch, key) => {
      // After any key that might change selection, sync the app state
      if (
        key &&
        (key.name === "up" ||
          key.name === "down" ||
          key.name === "j" ||
          key.name === "k")
      ) {
        setImmediate(() => {
          const currentSelection = this.table.selected;
          if (
            this.app &&
            typeof currentSelection === "number" &&
            currentSelection !== this.app.currentTaskIndex
          ) {
            this.app.currentTaskIndex = currentSelection;
          }
        });
      }
    });

    // Handle Enter key on the list widget directly
    this.table.key(["enter"], () => {
      // Don't handle Enter if the status modal is currently showing
      if (this.app.statusModal && this.app.statusModal.isShowing()) {
        return;
      }

      // Use the app's getCurrentTask method for consistency
      const selectedTask = this.app.getCurrentTask();
      if (selectedTask && this.app) {
        this.app.showTaskDetail(selectedTask.id);
      }
    });
  }

  /**
   * Update tasks in the list
   */
  updateTasks(tasks) {
    this.tasks = tasks;

    // Clear items first to prevent artifacts
    this.table.clearItems();

    const items = tasks.map((task) => this.formatTaskRow(task));

    // Temporarily disable the select event handler to prevent
    // blessed from overriding our currentTaskIndex when setItems is called
    const originalSelectHandler = this.table.listeners("select");
    this.table.removeAllListeners("select");

    this.table.setItems(items);

    // Restore the select event handler
    originalSelectHandler.forEach((handler) => {
      this.table.on("select", handler);
    });

    // Ensure we use the app's current index, not our cached one
    // But only set it if we have items to avoid blessed defaulting to 0
    if (items.length > 0) {
      this.setSelectedIndex(this.app.currentTaskIndex);
    }
  }

  /**
   * Calculate visual length of text (excluding blessed tags)
   */
  getVisualLength(text) {
    return text.replace(/\{[^}]*\}/g, "").length;
  }

  /**
   * Pad text to a specific visual width, accounting for blessed tags
   */
  padToWidth(text, width) {
    const visualLength = this.getVisualLength(text);
    const padding = Math.max(0, width - visualLength);
    return text + " ".repeat(padding);
  }

  /**
   * Format the header row
   */
  formatHeader() {
    const idCol = this.padToWidth("ID", 4);
    const statusCol = this.padToWidth("Status", 18);
    const priorityCol = this.padToWidth("Priority", 10);
    const titleCol = "Title";

    return `{bold}{underline}${idCol} ${statusCol} ${priorityCol} ${titleCol}{/underline}{/bold}`;
  }

  /**
   * Calculate available width for title column
   */
  calculateTitleWidth() {
    // Get the table's actual width
    let tableWidth =
      typeof this.table.width === "number"
        ? this.table.width
        : this.table.width || 80;

    // Account for table padding
    if (this.table.padding) {
      tableWidth -=
        (this.table.padding.left || 0) + (this.table.padding.right || 0);
    }

    // Account for borders (table has borders)
    tableWidth -= 2;

    // Fixed column widths: ID(4) + Status(18) + Priority(10) + spaces between columns(3)
    const fixedColumnsWidth = 4 + 18 + 10 + 3;

    // Calculate remaining width for title, with minimum of 20 characters
    const titleWidth = Math.max(20, tableWidth - fixedColumnsWidth);

    return titleWidth;
  }

  /**
   * Format a task row
   */
  formatTaskRow(task) {
    const statusIcon = this.getStatusIcon(task.status);
    const priorityColor = this.getPriorityColor(task.priority);

    // Column 1: ID (4 chars)
    const idCol = this.padToWidth(task.id.toString(), 4);

    // Column 2: Status with icon (18 chars total)
    const statusText = `${statusIcon} ${task.status}`;
    const statusCol = this.padToWidth(statusText, 18);

    // Column 3: Priority with color (10 chars)
    const priorityText = `{${priorityColor}}${task.priority || "medium"}{/${priorityColor}}`;
    const priorityCol = this.padToWidth(priorityText, 10);

    // Column 4: Title (dynamic width based on available space)
    const titleWidth = this.calculateTitleWidth();
    let titleText = this.truncateTitle(task.title, titleWidth);

    // Apply search highlighting if there's an active search query
    if (this.app.searchQuery) {
      titleText = this.highlightSearchTerms(titleText, this.app.searchQuery);
    }

    return `${idCol} ${statusCol} ${priorityCol} ${titleText}`;
  }

  /**
   * Get status icon for a task status
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
      default:
        return "{yellow-fg}[.]{/yellow-fg}";
    }
  }

  /**
   * Get color for priority
   */
  getPriorityColor(priority) {
    switch (priority) {
      case "high":
        return "red-fg";
      case "medium":
        return "yellow-fg";
      case "low":
        return "green-fg";
      default:
        return "white-fg";
    }
  }

  /**
   * Truncate title to fit in column
   */
  truncateTitle(title, maxLength) {
    if (title.length <= maxLength) {
      return title;
    }
    return title.substring(0, maxLength - 3) + "...";
  }

  /**
   * Highlight search terms in text using blessed.js tags
   */
  highlightSearchTerms(text, searchQuery) {
    if (!searchQuery || !text) {
      return text;
    }

    // Escape special regex characters in search query
    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Create case-insensitive regex
    const regex = new RegExp(`(${escapedQuery})`, "gi");

    // Replace matches with highlighted version
    return text.replace(regex, "{black-bg}{white-fg}$1{/white-fg}{/black-bg}");
  }

  /**
   * Set the selected row index with natural blessed.js scrolling behavior
   */
  setSelectedIndex(index) {
    // Don't proceed if we don't have any tasks
    if (this.tasks.length === 0) {
      return;
    }

    const validIndex = Math.max(0, Math.min(index, this.tasks.length - 1));
    this.selectedIndex = validIndex;

    // Only update app's currentTaskIndex if it's actually different
    // This prevents unnecessary updates that could cause sync issues
    if (this.app && this.app.currentTaskIndex !== validIndex) {
      this.app.currentTaskIndex = validIndex;
    }

    // Use blessed's built-in selection method with natural scrolling
    if (validIndex >= 0 && validIndex < this.table.items.length) {
      // Temporarily disable the select event to prevent feedback loops
      const selectHandlers = this.table.listeners("select");
      this.table.removeAllListeners("select");

      // Set the selection
      this.table.select(validIndex);

      // Restore the select event handlers
      selectHandlers.forEach((handler) => {
        this.table.on("select", handler);
      });
    }
  }

  /**
   * Focus the table
   */
  focus() {
    this.table.focus();
  }

  /**
   * Force synchronization between blessed list selection and app state
   */
  forceSyncSelection() {
    if (this.tasks.length === 0) return;

    const blessedSelection = this.table.selected;
    const appSelection = this.app.currentTaskIndex;

    // If they're different, use the app's selection as the source of truth
    if (
      typeof blessedSelection === "number" &&
      blessedSelection !== appSelection
    ) {
      this.setSelectedIndex(appSelection);
    }
  }

  /**
   * Get the table widget
   */
  getWidget() {
    return this.container;
  }

  /**
   * Listen for screen resize and refresh the table display
   */
  attachResizeHandler() {
    if (this.app && this.app.screen) {
      this.app.screen.on("resize", () => {
        // Refresh the table with current tasks to recalculate column widths
        if (this.tasks && this.tasks.length > 0) {
          this.updateTasks(this.tasks);
        }
      });
    }
  }
}
