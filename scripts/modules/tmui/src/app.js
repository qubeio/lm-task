/**
 * TUI Application
 * Main application class for the TaskMaster Terminal User Interface
 */

import fs from "fs";
import path, { basename } from "path";
import { execSync } from 'child_process';
import blessed from "blessed";
import { CliAdapter } from "./utils/cliAdapter.js";
import { JsonLoader } from "./utils/jsonLoader.js";
import { TaskListScreen } from "./screens/TaskListScreen.js";
import { TaskDetailScreen } from "./screens/TaskDetailScreen.js";
import { SearchScreen } from "./screens/SearchScreen.js";
import { StatusModal } from "./components/StatusModal.js";
import { KeyHandlers } from "./utils/keyHandlers.js";
import { getTheme } from "./styles/theme.js";
import { logger } from "./utils/logger.js";

export class TUIApp {
  constructor(options = {}) {
    this.options = {
      projectRoot: options.projectRoot || process.cwd(),
      tasksFile: options.tasksFile,
      theme: options.theme || "default",
      refreshInterval: options.refreshInterval || 30,
      autoRefresh: options.autoRefresh !== false, // Default to true
      autoRefreshInterval: options.autoRefreshInterval || 2000, // 2 seconds
      snapshotMode: options.snapshotMode || false,
      snapshotDelay: options.snapshotDelay || 2000,
      ...options,
    };

    this.screen = null;
    this.currentScreen = null;
    this.cliAdapter = null;
    this.jsonLoader = null;
    this.keyHandlers = null;
    this.theme = getTheme(this.options.theme);

    // Screen instances
    this.taskListScreen = null;
    this.taskDetailScreen = null;
    this.searchScreen = null;
    this.statusModal = null;

    // Application state
    this.tasks = [];
    this.currentTaskIndex = 0;
    this.searchQuery = "";
    this.filteredTasks = [];
    this.searchResultIndex = 0; // Track current search result for n/N navigation

    // Render debouncing to prevent character artifacts
    this.renderTimeout = null;
    this.isRendering = false;

    // Auto-refresh state
    this.autoRefreshTimer = null;
    this.lastTasksFileModTime = null;
    this.isRefreshing = false;
    this.tasksFilePath = null;
  }

  /**
   * Initialize and start the TUI application
   */
  async start() {
    logger.log('TUIApp.start() called.');
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

      // Start auto-refresh if enabled and not in snapshot mode
      if (this.options.autoRefresh && !this.options.snapshotMode) {
        this.startAutoRefresh();
      }

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
      logger.error('Error during TUIApp.start()', error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Initialize the application components
   */
  async initialize() {
    logger.log('TUIApp.initialize() called.');
    // Create the main screen
    this.screen = blessed.screen({
      smartCSR: true,
      title: "LM-Tasker TUI",
      dockBorders: true,
      fullUnicode: true,
      autoPadding: true,
      // Enable mouse support
      mouse: true,
      // More conservative terminal handling
      sendFocus: false,
      warnings: false,
      // Disable problematic features that might cause color issues
      useBCE: false,
    });

    // Initialize CLI adapter (keeping for backward compatibility)
    this.cliAdapter = new CliAdapter({
      projectRoot: this.options.projectRoot,
      tasksFile: this.options.tasksFile,
    });
    
    // Initialize JSON loader for direct file access
    this.jsonLoader = new JsonLoader({
      projectRoot: this.options.projectRoot,
      tasksFile: this.options.tasksFile,
    });

    // Set up tasks file path for auto-refresh
    this.tasksFilePath = this.jsonLoader.tasksFile || this.cliAdapter.tasksFile;

    // Initialize key handlers
    this.keyHandlers = new KeyHandlers(this);

    // Get Git repository name
    let repositoryName = "TaskMaster"; // Default value
    try {
      const repoPath = execSync('git rev-parse --show-toplevel', { encoding: 'utf8', stdio: 'pipe' }).trim();
      if (repoPath) {
        repositoryName = basename(repoPath);
      }
    } catch (error) {
      logger.warn('Could not determine Git repository name. Using default "TaskMaster". Error: ' + error.message);
    }


    // Initialize screens
    this.taskListScreen = new TaskListScreen(this, { height: "100%-3", repositoryName });
    this.taskDetailScreen = new TaskDetailScreen(this, { height: "100%-2" });
    this.searchScreen = new SearchScreen(this);
    this.statusModal = new StatusModal(this);
  }

  /**
   * Load tasks directly from tasks.json file
   */
  async loadTasks() {
    logger.log('TUIApp.loadTasks() called.');
    try {
      const result = await this.jsonLoader.getTasks({ withSubtasks: true });
      this.tasks = result.tasks || [];
      this.filteredTasks = [...this.tasks];
      this.currentTaskIndex = Math.min(
        this.currentTaskIndex,
        this.tasks.length - 1
      );

      // Update last modification time for auto-refresh
      this.updateLastModTime();
    } catch (error) {
      logger.error('Error in TUIApp.loadTasks()', error);
      this.showError(`Failed to load tasks: ${error.message}`);
      this.tasks = [];
      this.filteredTasks = [];
    }
  }

  /**
   * Start automatic refresh
   */
  startAutoRefresh() {
    if (this.autoRefreshTimer) {
      return; // Already started
    }

    this.autoRefreshTimer = setInterval(async () => {
      await this.checkAndRefresh();
    }, this.options.autoRefreshInterval);
  }

  /**
   * Stop automatic refresh
   */
  stopAutoRefresh() {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
    }
  }

  /**
   * Check if tasks file has changed and refresh if needed
   */
  async checkAndRefresh() {
    if (this.isRefreshing || !this.tasksFilePath) {
      return;
    }

    try {
      // Check if file exists and get modification time
      const stats = await fs.promises.stat(this.tasksFilePath);
      const currentModTime = stats.mtime.getTime();

      // If this is the first check or file has been modified
      if (
        this.lastTasksFileModTime === null ||
        currentModTime > this.lastTasksFileModTime
      ) {
        await this.autoRefresh();
      }
    } catch (error) {
      // File might not exist or be temporarily unavailable
      // Don't show error for auto-refresh failures to avoid spam
    }
  }

  /**
   * Perform automatic refresh while preserving user state
   */
  async autoRefresh() {
    if (this.isRefreshing) {
      return;
    }

    this.isRefreshing = true;

    try {
      // Save current state
      const currentTask = this.getCurrentTask();
      const currentTaskId = currentTask ? currentTask.id : null;
      const currentSearchQuery = this.searchQuery;
      const currentScreen = this.currentScreen;

      // Load new tasks
      await this.loadTasks();

      // Restore search if it was active
      if (currentSearchQuery) {
        this.performSearch(currentSearchQuery);
      }

      // Try to restore selection to the same task
      if (currentTaskId) {
        const newIndex = this.filteredTasks.findIndex(
          (task) => task.id === currentTaskId
        );
        if (newIndex >= 0) {
          this.currentTaskIndex = newIndex;
        }
      }

      // Update the current screen
      if (currentScreen === this.taskListScreen) {
        this.taskListScreen.updateTasks(this.filteredTasks);
        this.taskListScreen.setSelectedIndex(this.currentTaskIndex);
      } else if (currentScreen === this.taskDetailScreen && currentTaskId) {
        // Refresh task detail view if we're currently viewing a task
        try {
          const updatedTask = await this.jsonLoader.getTask(currentTaskId);
          this.taskDetailScreen.setTask(updatedTask);
        } catch (error) {
          // Task might have been deleted, return to task list
          this.showTaskList();
        }
      }

      this.render();
    } catch (error) {
      // Silently handle auto-refresh errors to avoid disrupting user experience
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Update the last modification time of the tasks file
   */
  updateLastModTime() {
    if (!this.tasksFilePath) {
      return;
    }

    try {
      const stats = fs.statSync(this.tasksFilePath);
      this.lastTasksFileModTime = stats.mtime.getTime();
    } catch (error) {
      // File might not exist yet
      this.lastTasksFileModTime = null;
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
    this.render(); // Ensure the screen updates immediately
  }

  /**
   * Show the task detail screen for a specific task
   */
  async showTaskDetail(taskId) {
    try {
      const taskData = await this.jsonLoader.getTask(taskId);

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
    this.searchScreen.focus();
  }

  /**
   * Focus the main task list
   */
  focusTaskList() {
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
    // Note: setSelectedIndex is now called within updateTasks to ensure proper timing
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

    // Sync with the blessed list widget's actual selection if available
    if (
      this.taskListScreen &&
      this.taskListScreen.taskTable &&
      this.taskListScreen.taskTable.table
    ) {
      const blessedSelection = this.taskListScreen.taskTable.table.selected;
      if (
        typeof blessedSelection === "number" &&
        blessedSelection >= 0 &&
        blessedSelection < this.filteredTasks.length
      ) {
        this.currentTaskIndex = blessedSelection;
      }
    }

    // Ensure currentTaskIndex is within bounds
    const validIndex = Math.max(
      0,
      Math.min(this.currentTaskIndex, this.filteredTasks.length - 1)
    );

    // Update currentTaskIndex if it was out of bounds
    if (validIndex !== this.currentTaskIndex) {
      this.currentTaskIndex = validIndex;
    }

    return this.filteredTasks[validIndex] || null;
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
   * Refresh task list (manual refresh)
   */
  async refresh() {
    logger.log('TUIApp.refresh() called.');
    // Temporarily disable auto-refresh during manual refresh
    const wasAutoRefreshEnabled = this.autoRefreshTimer !== null;
    if (wasAutoRefreshEnabled) {
      this.stopAutoRefresh();
    }

    try {
      // Save current state
      const currentTask = this.getCurrentTask();
      const currentTaskId = currentTask ? currentTask.id : null;

      await this.loadTasks();
      this.performSearch(this.searchQuery); // Re-apply current search

      // Try to restore selection to the same task
      if (currentTaskId) {
        const newIndex = this.filteredTasks.findIndex(
          (task) => task.id === currentTaskId
        );
        if (newIndex >= 0) {
          this.currentTaskIndex = newIndex;
          if (this.currentScreen === this.taskListScreen) {
            this.taskListScreen.setSelectedIndex(this.currentTaskIndex);
          }
        }
      }

      this.render();
    } finally {
      // Re-enable auto-refresh if it was enabled
      if (wasAutoRefreshEnabled && this.options.autoRefresh) {
        this.startAutoRefresh();
      }
    }
  }

  /**
   * Show status update modal for the current task
   */
  showStatusUpdate() {
    const currentTask = this.getCurrentTask();
    if (!currentTask) {
      this.showError("No task selected");
      return;
    }

    this.statusModal.show(currentTask, async (newStatus) => {
      await this.updateTaskStatus(currentTask.id, newStatus);
    });
  }

  /**
   * Update task status and refresh the display
   */
  async updateTaskStatus(taskId, newStatus) {
    try {
      // Show loading message
      this.taskListScreen.statusBar.setMessage(
        `Updating task ${taskId} status to ${newStatus}...`,
        1000
      );

      // Update via JSON loader
      await this.jsonLoader.updateTaskStatus(taskId, newStatus);

      // Refresh the task list to show the change
      await this.refresh();

      // Show success message
      this.taskListScreen.statusBar.setMessage(
        `Task ${taskId} status updated to ${newStatus}!`,
        2000
      );
    } catch (error) {
      this.showError(`Failed to update task status: ${error.message}`);
    }
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
    logger.log('TUIApp.cleanup() called.');
    // Stop auto-refresh timer
    this.stopAutoRefresh();

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
        logger.log('Screen destroyed successfully.');
      } catch (error) {
        logger.error('Error destroying screen during cleanup', error);
        // Silently handle cleanup errors to prevent exit noise
        // The terminal will restore itself anyway
      }
      this.screen = null; // Ensure screen is marked as null after attempt
    }
    logger.log('TUIApp.cleanup() finished.');
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
