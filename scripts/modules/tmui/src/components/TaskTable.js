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
  }

  /**
   * Create the list widget with a fixed header
   */
  createTable() {
    this.container = blessed.box({
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
      width: "100%-2",
      height: "100%-3",
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
  }

  /**
   * Update tasks in the list
   */
  updateTasks(tasks) {
    this.tasks = tasks;

    const items = tasks.map((task) => this.formatTaskRow(task));

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

    return `{bold}{underline}${idCol}  ${statusCol}  ${priorityCol}  ${titleCol}{/}{/}`;
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
   * Set the selected row index with improved scrolling behavior
   */
  setSelectedIndex(index) {
    this.selectedIndex = Math.max(0, Math.min(index, this.tasks.length - 1));

    // Use blessed's built-in selection method
    if (
      this.selectedIndex >= 0 &&
      this.selectedIndex < this.table.items.length
    ) {
      // First, select the item using blessed's native method
      this.table.select(this.selectedIndex);

      // Then apply smart scrolling behavior
      this.smartScroll();
    }
  }

  /**
   * Smart scrolling behavior - selection moves first, content scrolls only when needed
   */
  smartScroll() {
    const totalItems = this.table.items.length;
    const currentIndex = this.selectedIndex;

    // Get viewport height (visible rows)
    const viewportHeight = this.table.height - 2; // Account for borders

    if (totalItems <= viewportHeight) {
      // All items fit in viewport, no scrolling needed
      return;
    }

    // Get current scroll position
    const currentScrollTop = this.table.childBase || 0;

    // Calculate the position of the selected item relative to the viewport
    const selectedPositionInViewport = currentIndex - currentScrollTop;

    // Define scroll trigger zones (when selection should trigger scrolling)
    const scrollMargin = 2; // Start scrolling when selection is within 2 lines of edge

    // Check if we need to scroll up
    if (selectedPositionInViewport < scrollMargin && currentScrollTop > 0) {
      // Selection is too close to the top, scroll up
      const scrollAmount = Math.min(
        scrollMargin - selectedPositionInViewport,
        currentScrollTop
      );
      for (let i = 0; i < scrollAmount; i++) {
        this.table.scroll(-1);
      }
    }
    // Check if we need to scroll down
    else if (
      selectedPositionInViewport >= viewportHeight - scrollMargin &&
      currentScrollTop < totalItems - viewportHeight
    ) {
      // Selection is too close to the bottom, scroll down
      const maxScrollDown = totalItems - viewportHeight - currentScrollTop;
      const scrollAmount = Math.min(
        selectedPositionInViewport - (viewportHeight - scrollMargin - 1),
        maxScrollDown
      );
      for (let i = 0; i < scrollAmount; i++) {
        this.table.scroll(1);
      }
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
    return this.container;
  }
}
