/**
 * Task List Screen
 * Main screen component for displaying the task list
 */

import blessed from "blessed";
import { TaskTable } from "../components/TaskTable.js";
import { logger } from "../utils/logger.js";
import { StatusBar } from "../components/StatusBar.js";

export class TaskListScreen {
  constructor(app, options = {}) {
    logger.log('TaskListScreen constructor called.');
    this.app = app;
    this.options = options;
    this.repositoryName = options.repositoryName || "Tasks"; // Default if not provided
    this.container = null;
    this.taskTable = null;
    this.statusBar = null;
    this.selectedIndex = 0;

    this.createComponents();
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
      label: ` LM-Tasker TUI \n${this.repositoryName}\n `, // Use repositoryName here
      tags: true,
    });

    // Task table
    this.taskTable = new TaskTable(this);

    // Status bar
    this.statusBar = new StatusBar(this);
  }

  /**
   * Show the screen
   */
  show() {
    logger.log('TaskListScreen.show() called.');
    this.container.show();
    this.updateDisplay();
    this.statusBar.setSecondLine("Placeholder: Task List View - Second Line"); // Add this line
    this.focus();

    // Ensure selection is properly synchronized after the screen is shown
    // Use setImmediate to ensure the blessed widget is fully rendered
    setImmediate(() => {
      this.taskTable.forceSyncSelection();
    });
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
    this.taskTable.focus();
  }

  /**
   * Update the task list display
   */
  updateTasks(tasks) {
    this.taskTable.updateTasks(tasks);
    this.statusBar.updateStats(this.calculateStats(tasks));
  }

  /**
   * Set the selected task index
   */
  setSelectedIndex(index) {
    this.selectedIndex = index;
    this.taskTable.setSelectedIndex(index);
  }

  /**
   * Update the entire display
   */
  updateDisplay() {
    logger.log('TaskListScreen.updateDisplay() called.');
    const tasks = this.app.filteredTasks;
    this.updateTasks(tasks);
    // Note: setSelectedIndex is now called within updateTasks to ensure proper timing

    // Update header with task count
    const totalTasks = this.app.tasks.length;
    const filteredCount = tasks.length;

    let headerText = ` TaskMaster TUI `;
    if (this.app.searchQuery) {
      headerText += `- Search: "${this.app.searchQuery}" (${filteredCount}/${totalTasks}) `;
    } else {
      headerText += `[${totalTasks} tasks] `;
    }

    const fullHeaderTextWithSubtitle = `${headerText}\n-Repository: ${this.repositoryName}-\n `;
    this.container.setLabel(fullHeaderTextWithSubtitle);
  }

  /**
   * Calculate task statistics
   */
  calculateStats(tasks) {
    const stats = {
      total: tasks.length,
      completed: 0,
      inProgress: 0,
      pending: 0,
      blocked: 0,
      cancelled: 0,
    };

    tasks.forEach((task) => {
      switch (task.status) {
        case "done":
          stats.completed++;
          break;
        case "in-progress":
          stats.inProgress++;
          break;
        case "pending":
          stats.pending++;
          break;
        case "blocked":
          stats.blocked++;
          break;
        case "cancelled":
          stats.cancelled++;
          break;
      }
    });

    return stats;
  }

  /**
   * Get the container element
   */
  getContainer() {
    return this.container;
  }
}
