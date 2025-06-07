/**
 * Task Table Component
 * Displays tasks in a list format using blessed list widget
 */

import blessed from "blessed";

export class TaskTable {
  constructor(screen) {
    this.screen = screen;
    this.app = screen.app;
    this.table = null;
    this.tasks = [];
    this.selectedIndex = 0;

    this.createTable();
  }

  /**
   * Create the table widget with built-in header support
   */
  createTable() {
    this.table = blessed.table({
      parent: this.screen.getContainer(),
      top: 1,
      left: 1,
      width: "100%-2",
      height: "100%-3", // Leave space for status bar
      border: {
        type: "line",
      },
      style: {
        border: {
          fg: this.app.theme.border,
        },
        header: {
          fg: this.app.theme.header,
          bold: true,
        },
        cell: {
          fg: this.app.theme.text,
        },
        selected: {
          bg: this.app.theme.selected,
          fg: this.app.theme.selectedText,
        },
      },
      scrollable: true,
      alwaysScroll: true,
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
      label: " Tasks ",
      columnSpacing: 2,
      columnWidth: [6, 14, 10, 0], // ID, Status, Priority, Title (0 = flexible)
    });
  }

  /**
   * Update tasks in the list
   */
  updateTasks(tasks) {
    this.tasks = tasks;

    const items = [];

    // Add header that will stay visible
    items.push(this.formatHeader());

    // Add tasks
    tasks.forEach((task, index) => {
      items.push(this.formatTaskRow(task));
    });

    this.table.setItems(items);
    this.setSelectedIndex(this.selectedIndex);
  }

  /**
   * Format the header row
   */
  formatHeader() {
    const idCol = "ID".padEnd(4);
    const statusCol = "Status".padEnd(12);
    const priorityCol = "Priority".padEnd(8);
    const titleCol = "Title";

    return `{bold}${idCol}  ${statusCol}  ${priorityCol}  ${titleCol}{/}`;
  }

  /**
   * Format a task row
   */
  formatTaskRow(task) {
    const statusIcon = this.getStatusIcon(task.status);
    const priorityColor = this.getPriorityColor(task.priority);

    const idCol = task.id.toString().padEnd(4);
    const statusCol = `${statusIcon} ${task.status}`.padEnd(12);
    // For priority, we need to account for color tags but pad the actual text content
    const priorityText = (task.priority || "medium").padEnd(8);
    const priorityCol = `{${priorityColor}}${priorityText}{/}`;
    const titleCol = this.truncateTitle(task.title, 60);

    return `${idCol}  ${statusCol}  ${priorityCol}  ${titleCol}`;
  }

  /**
   * Get status icon for a task status
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
      default:
        return "⏳";
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
   * Set the selected row index
   */
  setSelectedIndex(index) {
    this.selectedIndex = Math.max(0, Math.min(index, this.tasks.length - 1));

    // Select the task row (index + 1 to account for header)
    const listIndex = this.selectedIndex + 1;
    if (listIndex < this.table.items.length) {
      this.table.select(listIndex);
    }
  }

  /**
   * Focus the table
   */
  focus() {
    this.table.focus();
  }

  /**
   * Get the table widget
   */
  getWidget() {
    return this.table;
  }
}
