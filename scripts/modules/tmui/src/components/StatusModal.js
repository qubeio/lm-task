/**
 * Status Modal Component
 * Modal dialog for selecting task status
 */

import blessed from "blessed";

export class StatusModal {
  constructor(app) {
    this.app = app;
    this.modal = null;
    this.list = null;
    this.isVisible = false;
    this.onStatusSelected = null;
    this.currentTask = null;

    this.statusOptions = [
      { value: "pending", label: "Pending", color: "yellow" },
      { value: "in-progress", label: "In Progress", color: "blue" },
      { value: "done", label: "Done", color: "green" },
      { value: "cancelled", label: "Cancelled", color: "red" },
      { value: "deferred", label: "Deferred", color: "gray" },
    ];

    this.createModal();
  }

  /**
   * Create the modal components
   */
  createModal() {
    // Modal background overlay
    this.modal = blessed.box({
      parent: this.app.screen,
      top: "center",
      left: "center",
      width: 40,
      height: 12,
      hidden: true,
      border: {
        type: "line",
      },
      style: {
        border: {
          fg: this.app.theme.border,
        },
        bg: "black",
      },
      label: " Update Status ",
      tags: true,
      keys: true,
      vi: true,
    });

    // Status selection list
    this.list = blessed.list({
      parent: this.modal,
      top: 1,
      left: 1,
      width: "100%-2",
      height: "100%-3",
      keys: true,
      vi: true,
      mouse: true,
      interactive: true,
      tags: true,
      style: {
        selected: {
          bg: this.app.theme.selectedBg,
          fg: this.app.theme.selectedFg,
        },
        item: {
          fg: this.app.theme.text,
        },
      },
      items: this.statusOptions.map(
        (option) => `{${option.color}-fg}${option.label}{/}`
      ),
    });

    // Instructions
    const instructions = blessed.text({
      parent: this.modal,
      bottom: 0,
      left: 1,
      width: "100%-2",
      height: 1,
      content: "Enter: Select  1-5: Quick select  ESC: Cancel",
      style: {
        fg: "gray",
      },
    });

    this.setupEventHandlers();
  }

  /**
   * Setup event handlers for the modal
   */
  setupEventHandlers() {
    // Handle Enter key - select status
    this.list.key(["enter"], () => {
      this.selectCurrentStatus();
    });

    // Handle Escape key - cancel
    this.list.key(["escape"], () => {
      this.hide();
    });

    // Also handle escape on the modal itself
    this.modal.key(["escape"], () => {
      this.hide();
    });

    // Handle number keys for quick selection
    this.list.key(["1"], () => {
      this.selectStatus(0);
    });

    this.list.key(["2"], () => {
      this.selectStatus(1);
    });

    this.list.key(["3"], () => {
      this.selectStatus(2);
    });

    this.list.key(["4"], () => {
      this.selectStatus(3);
    });

    this.list.key(["5"], () => {
      this.selectStatus(4);
    });

    // Handle selection event
    this.list.on("select", (item, index) => {
      this.selectStatus(index);
    });
  }

  /**
   * Show the modal for a specific task
   */
  show(task, onStatusSelected) {
    this.currentTask = task;
    this.onStatusSelected = onStatusSelected;

    // Update modal label with task info
    this.modal.setLabel(
      ` Update Status - Task #${task.id}: ${task.title.substring(0, 20)}... `
    );

    // Set initial selection based on current status
    const currentIndex = this.statusOptions.findIndex(
      (option) => option.value === task.status
    );
    if (currentIndex >= 0) {
      this.list.select(currentIndex);
    }

    this.modal.show();
    this.isVisible = true;

    // Use setImmediate to ensure the modal is rendered before focusing
    setImmediate(() => {
      this.list.focus();
      this.app.render();
    });
  }

  /**
   * Hide the modal
   */
  hide() {
    this.modal.hide();
    this.isVisible = false;
    this.currentTask = null;
    this.onStatusSelected = null;

    // Return focus to the appropriate screen based on current context
    if (this.app.currentScreen === this.app.taskDetailScreen) {
      this.app.taskDetailScreen.focus();
    } else {
      this.app.taskListScreen.focus();
    }
    this.app.render();
  }

  /**
   * Select the currently highlighted status
   */
  selectCurrentStatus() {
    const selectedIndex = this.list.selected;
    this.selectStatus(selectedIndex);
  }

  /**
   * Select a status by index
   */
  selectStatus(index) {
    if (index >= 0 && index < this.statusOptions.length) {
      const selectedStatus = this.statusOptions[index];

      if (this.onStatusSelected) {
        this.onStatusSelected(selectedStatus.value);
      }

      this.hide();
    }
  }

  /**
   * Check if the modal is currently visible
   */
  isShowing() {
    return this.isVisible;
  }
}
