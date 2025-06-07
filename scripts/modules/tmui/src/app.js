/**
 * TUI Application
 * Main application class for the TaskMaster Terminal User Interface
 */

import blessed from "blessed";
import { TaskListScreen } from "./screens/TaskListScreen.js";
import { TaskDetailScreen } from "./screens/TaskDetailScreen.js";
import { SearchScreen } from "./screens/SearchScreen.js";
import { CliAdapter } from "./utils/cliAdapter.js";
import { KeyHandlers } from "./utils/keyHandlers.js";
import { getTheme } from "./styles/theme.js";

export class TUIApp {
  constructor(options = {}) {
    this.options = {
      projectRoot: options.projectRoot || process.cwd(),
      tasksFile: options.tasksFile,
      theme: options.theme || "default",
      refreshInterval: options.refreshInterval || 30,
      snapshotMode: options.snapshotMode || false,
      snapshotDelay: options.snapshotDelay || 2000,
      ...options,
    };

    this.screen = null;
    this.currentScreen = null;
    this.cliAdapter = null;
    this.keyHandlers = null;
    this.theme = getTheme(this.options.theme);

    // Screen instances
    this.taskListScreen = null;
    this.taskDetailScreen = null;
    this.searchScreen = null;

    // Application state
    this.tasks = [];
    this.currentTaskIndex = 0;
    this.searchMode = false;
    this.searchQuery = "";
    this.filteredTasks = [];
    this.searchResultIndex = 0; // Track current search result for n/N navigation

    // Render debouncing to prevent character artifacts
    this.renderTimeout = null;
    this.isRendering = false;
  }

  /**
   * Initialize and start the TUI application
   */
  async start() {
    try {
      // console.log("DEBUG: Starting TUI initialization...");
      await this.initialize();
      // console.log("DEBUG: TUI initialized, loading tasks...");
      await this.loadTasks();
      // console.log(
      //   `DEBUG: Tasks loaded (${this.tasks.length} tasks), showing task list...`
      // );
      this.showTaskList();
      // console.log("DEBUG: Task list shown");

      if (this.options.snapshotMode) {
        // console.log(
        //   `DEBUG: Snapshot mode enabled, rendering and waiting ${this.options.snapshotDelay}ms...`
        // );
        // In snapshot mode, render once and then capture content
        this.render();
        // console.log("DEBUG: Initial render complete");

        setTimeout(() => {
          // console.log("DEBUG: Timeout reached, capturing snapshot...");
          // The snapshot will be taken by the external timeout command
        }, this.options.snapshotDelay);
      } else {
        // Normal interactive mode
        this.setupEventHandlers();
        this.render();
      }
    } catch (error) {
      // console.error("DEBUG: Error in TUI start:", error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Initialize the application components
   */
  async initialize() {
    // Create the main screen
    this.screen = blessed.screen({
      smartCSR: true,
      title: "TaskMaster TUI",
      dockBorders: true,
      fullUnicode: true,
      autoPadding: true,
      // More conservative terminal handling
      sendFocus: false,
      warnings: false,
      // Disable problematic features that might cause color issues
      useBCE: false,
    });

    // Initialize CLI adapter
    this.cliAdapter = new CliAdapter({
      projectRoot: this.options.projectRoot,
      tasksFile: this.options.tasksFile,
    });

    // Initialize key handlers
    this.keyHandlers = new KeyHandlers(this);

    // Initialize screens
    this.taskListScreen = new TaskListScreen(this);
    this.taskDetailScreen = new TaskDetailScreen(this);
    this.searchScreen = new SearchScreen(this);
  }

  /**
   * Load tasks from CLI adapter
   */
  async loadTasks() {
    try {
      const result = await this.cliAdapter.getTasks();
      this.tasks = result.tasks || [];
      this.filteredTasks = [...this.tasks];
      this.currentTaskIndex = Math.min(
        this.currentTaskIndex,
        this.tasks.length - 1
      );
    } catch (error) {
      this.showError(`Failed to load tasks: ${error.message}`);
      this.tasks = [];
      this.filteredTasks = [];
    }
  }

  /**
   * Show the task list screen
   */
  showTaskList() {
    if (this.currentScreen) {
      this.currentScreen.hide();
    }

    this.currentScreen = this.taskListScreen;
    this.taskListScreen.show();
    this.searchMode = false;
    this.render(); // Ensure the screen updates immediately
  }

  /**
   * Show the task detail screen for a specific task
   */
  async showTaskDetail(taskId) {
    try {
      const taskData = await this.cliAdapter.getTask(taskId);

      if (this.currentScreen) {
        this.currentScreen.hide();
      }

      this.currentScreen = this.taskDetailScreen;
      this.taskDetailScreen.setTask(taskData);
      this.taskDetailScreen.show();
      this.render(); // Ensure the screen updates immediately
    } catch (error) {
      this.showError(`Failed to load task details: ${error.message}`);
    }
  }

  /**
   * Show the search screen
   */
  showSearch() {
    this.searchMode = true;
    this.searchScreen.show();
    this.searchScreen.focus();
  }

  /**
   * Hide the search screen
   */
  hideSearch() {
    this.searchMode = false;
    this.searchScreen.hide();
    this.taskListScreen.focus();

    // Clear search highlighting by refreshing the task list
    this.taskListScreen.updateTasks(this.filteredTasks);
    this.render();
  }

  /**
   * Clear search completely and return to full task list
   */
  clearSearch() {
    this.searchQuery = "";
    this.searchResultIndex = 0;
    this.filteredTasks = [...this.tasks];
    this.currentTaskIndex = 0;
    this.searchScreen.clear();
    this.taskListScreen.updateTasks(this.filteredTasks);
    this.taskListScreen.setSelectedIndex(0);
    this.render();
  }

  /**
   * Perform search on tasks
   */
  performSearch(query) {
    this.searchQuery = query.toLowerCase();

    if (!this.searchQuery) {
      this.filteredTasks = [...this.tasks];
    } else {
      this.filteredTasks = this.tasks.filter(
        (task) =>
          task.title.toLowerCase().includes(this.searchQuery) ||
          task.description.toLowerCase().includes(this.searchQuery) ||
          (task.details &&
            task.details.toLowerCase().includes(this.searchQuery))
      );
    }

    this.currentTaskIndex = 0;
    this.searchResultIndex = 0; // Reset search result navigation
    this.taskListScreen.updateTasks(this.filteredTasks);
    this.render();
  }

  /**
   * Get the currently selected task
   */
  getCurrentTask() {
    if (this.filteredTasks.length === 0) return null;
    return this.filteredTasks[this.currentTaskIndex] || null;
  }

  /**
   * Move selection up
   */
  moveUp() {
    if (this.filteredTasks.length === 0) return;
    this.currentTaskIndex = Math.max(0, this.currentTaskIndex - 1);
    this.taskListScreen.setSelectedIndex(this.currentTaskIndex);
    this.render();
  }

  /**
   * Move selection down
   */
  moveDown() {
    if (this.filteredTasks.length === 0) return;
    this.currentTaskIndex = Math.min(
      this.filteredTasks.length - 1,
      this.currentTaskIndex + 1
    );
    this.taskListScreen.setSelectedIndex(this.currentTaskIndex);
    this.render();
  }

  /**
   * Move to first task
   */
  moveToFirst() {
    if (this.filteredTasks.length === 0) return;
    this.currentTaskIndex = 0;
    this.taskListScreen.setSelectedIndex(this.currentTaskIndex);
    this.render();
  }

  /**
   * Move to last task
   */
  moveToLast() {
    if (this.filteredTasks.length === 0) return;
    this.currentTaskIndex = this.filteredTasks.length - 1;
    this.taskListScreen.setSelectedIndex(this.currentTaskIndex);
    this.render();
  }

  /**
   * Navigate to next search result
   */
  nextSearchResult() {
    if (!this.searchQuery || this.filteredTasks.length === 0) return;

    this.searchResultIndex =
      (this.searchResultIndex + 1) % this.filteredTasks.length;
    this.currentTaskIndex = this.searchResultIndex;
    this.taskListScreen.setSelectedIndex(this.currentTaskIndex);
    this.render();
  }

  /**
   * Navigate to previous search result
   */
  previousSearchResult() {
    if (!this.searchQuery || this.filteredTasks.length === 0) return;

    this.searchResultIndex =
      this.searchResultIndex === 0
        ? this.filteredTasks.length - 1
        : this.searchResultIndex - 1;
    this.currentTaskIndex = this.searchResultIndex;
    this.taskListScreen.setSelectedIndex(this.currentTaskIndex);
    this.render();
  }

  /**
   * Refresh task list
   */
  async refresh() {
    await this.loadTasks();
    this.performSearch(this.searchQuery); // Re-apply current search
    this.render();
  }

  /**
   * Show error message
   */
  showError(message) {
    const errorBox = blessed.message({
      parent: this.screen,
      top: "center",
      left: "center",
      width: "50%",
      height: "shrink",
      label: " Error ",
      tags: true,
      keys: true,
      vi: true,
      mouse: true,
      border: {
        type: "line",
      },
      style: {
        fg: "white",
        bg: "red",
        border: {
          fg: "red",
        },
      },
    });

    errorBox.display(message, () => {
      this.render();
    });
  }

  /**
   * Setup global event handlers
   */
  setupEventHandlers() {
    // Global quit handler
    this.screen.key(["q", "C-c"], () => {
      this.quit();
    });

    // Delegate other key handling to KeyHandlers
    this.keyHandlers.setup();

    // Handle screen resize
    this.screen.on("resize", () => {
      this.render();
    });

    // Handle process exit events to ensure clean terminal restoration
    process.on("SIGINT", () => {
      this.cleanup();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      this.cleanup();
      process.exit(0);
    });

    // Handle uncaught exceptions during exit
    process.on("exit", () => {
      try {
        if (this.screen && this.screen.program) {
          this.screen.program.reset();
          this.screen.program.showCursor();
        }
      } catch (error) {
        // Silently handle any final cleanup errors
      }
    });
  }

  /**
   * Render the screen with debouncing to prevent artifacts
   */
  render() {
    // Clear any pending render
    if (this.renderTimeout) {
      clearTimeout(this.renderTimeout);
    }

    // If already rendering, schedule for later
    if (this.isRendering) {
      this.renderTimeout = setTimeout(() => {
        this.render();
      }, 16); // ~60fps
      return;
    }

    // Perform the actual render
    this.isRendering = true;
    try {
      this.screen.render();
    } finally {
      this.isRendering = false;
    }
  }

  /**
   * Force immediate render (use sparingly)
   */
  forceRender() {
    if (this.renderTimeout) {
      clearTimeout(this.renderTimeout);
      this.renderTimeout = null;
    }
    this.isRendering = true;
    try {
      this.screen.render();
    } finally {
      this.isRendering = false;
    }
  }

  /**
   * Quit the application
   */
  quit() {
    this.cleanup();
    process.exit(0);
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Clear any pending render timeout
    if (this.renderTimeout) {
      clearTimeout(this.renderTimeout);
      this.renderTimeout = null;
    }

    if (this.screen) {
      try {
        // Try to reset terminal state before destroying
        this.screen.program.reset();
        this.screen.program.showCursor();
        this.screen.destroy();
      } catch (error) {
        // Silently handle cleanup errors to prevent exit noise
        // The terminal will restore itself anyway
      }
    }
  }

  /**
   * Capture a snapshot of the current TUI state
   */
  captureSnapshot() {
    // console.log("\n=== TUI SNAPSHOT ===");

    // Get screen dimensions
    const width = this.screen.width;
    const height = this.screen.height;

    // console.log(`Screen size: ${width}x${height}`);
    // console.log(`Tasks loaded: ${this.tasks.length}`);
    // console.log(`Filtered tasks: ${this.filteredTasks.length}`);
    // console.log(`Current task index: ${this.currentTaskIndex}`);
    // console.log(`Search query: "${this.searchQuery}"`);

    // Try to capture the rendered content
    try {
      // console.log("\nRendered content:");
      // console.log("─".repeat(width));

      // Get the screen content
      const lines = this.screen.lines || [];
      for (let i = 0; i < Math.min(lines.length, height); i++) {
        const line = lines[i] || [];
        let lineStr = "";
        for (let j = 0; j < Math.min(line.length, width); j++) {
          const cell = line[j];
          if (cell && typeof cell === "object" && cell.ch) {
            lineStr += cell.ch;
          } else if (typeof cell === "string") {
            lineStr += cell;
          } else {
            lineStr += " ";
          }
        }
        // console.log(lineStr);
      }
      // console.log("");

      if (lines.length === 0) {
        // console.log("─".repeat(width));
        // console.log("No rendered content available");
      }

      // console.log("\nTask data fallback:");
      if (this.filteredTasks && this.filteredTasks.length > 0) {
        // console.log("ID | Status    | Priority | Title");
        // console.log("---|-----------|----------|------");
        this.filteredTasks.slice(0, 10).forEach((task) => {
          // console.log(
          //   `${task.id.toString().padStart(2)} | ${task.status
          //     .padEnd(9)
          //     .substring(0, 9)} | ${(task.priority || "medium")
          //     .padEnd(8)
          //     .substring(0, 8)} | ${task.title.substring(0, 40)}`
          // );
        });
      } else {
        // console.log("No tasks to display");
      }
    } catch (error) {
      // Keep this one for actual errors
      console.error("Error capturing snapshot:", error);
    }

    // console.log("===================\n");
  }
}
