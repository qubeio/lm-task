/**
 * Key Handlers
 * Centralized keyboard event handling for the TUI
 */

export class KeyHandlers {
  constructor(app) {
    this.app = app;
  }

  /**
   * Setup keyboard event handlers
   */
  setup() {
    // Let blessed.js handle navigation naturally - no custom up/down handlers needed

    // Go to first/last task
    this.app.screen.key(["g"], () => {
      // Wait for second 'g' for 'gg' command
      this.waitForSecondG();
    });

    this.app.screen.key(["G"], () => {
      this.app.moveToLast();
    });

    // Page navigation
    this.app.screen.key(["C-f", "pagedown"], () => {
      this.pageDown();
    });

    this.app.screen.key(["C-b", "pageup"], () => {
      this.pageUp();
    });

    // Enter key - view task details
    this.app.screen.key(["enter"], () => {
      const currentTask = this.app.getCurrentTask();
      if (
        currentTask &&
        this.app.screen.focused !== this.app.searchScreen.searchBox
      ) {
        this.app.showTaskDetail(currentTask.id);
      }
    });

    // Search
    this.app.screen.key(["/"], () => {
      this.app.showSearch();
    });

    // Search result navigation
    this.app.screen.key(["n"], () => {
      this.app.nextSearchResult();
    });

    this.app.screen.key(["N"], () => {
      this.app.previousSearchResult();
    });

    // Clear search
    this.app.screen.key(["c"], () => {
      this.app.clearSearch();
    });

    // Refresh
    this.app.screen.key(["r"], () => {
      this.refresh();
    });

    // Help
    this.app.screen.key(["?"], () => {
      this.showHelp();
    });

    // Escape key - context-sensitive
    this.app.screen.key(["escape"], () => {
      this.handleEscape();
    });
  }

  /**
   * Wait for second 'g' to complete 'gg' command
   */
  waitForSecondG() {
    const timeout = setTimeout(() => {
      // If no second 'g' within 500ms, ignore
      this.app.screen.removeListener("keypress", secondGHandler);
    }, 500);

    const secondGHandler = (ch, key) => {
      if (key && key.name === "g") {
        clearTimeout(timeout);
        this.app.screen.removeListener("keypress", secondGHandler);
        this.app.moveToFirst();
      } else {
        // Any other key cancels the 'gg' command
        clearTimeout(timeout);
        this.app.screen.removeListener("keypress", secondGHandler);
      }
    };

    this.app.screen.once("keypress", secondGHandler);
  }

  /**
   * Handle page down navigation
   */
  pageDown() {
    const pageSize = 10; // Number of tasks to skip
    const newIndex = Math.min(
      this.app.filteredTasks.length - 1,
      this.app.currentTaskIndex + pageSize
    );

    this.app.currentTaskIndex = newIndex;
    this.app.taskListScreen.setSelectedIndex(newIndex);
    this.app.render();
  }

  /**
   * Handle page up navigation
   */
  pageUp() {
    const pageSize = 10; // Number of tasks to skip
    const newIndex = Math.max(0, this.app.currentTaskIndex - pageSize);

    this.app.currentTaskIndex = newIndex;
    this.app.taskListScreen.setSelectedIndex(newIndex);
    this.app.render();
  }

  /**
   * Handle refresh action
   */
  async refresh() {
    try {
      this.app.taskListScreen.statusBar.setMessage("Refreshing tasks...", 1000);
      await this.app.refresh();
      this.app.taskListScreen.statusBar.setMessage("Tasks refreshed!", 2000);
    } catch (error) {
      this.app.showError(`Failed to refresh: ${error.message}`);
    }
  }

  /**
   * Show help dialog
   */
  showHelp() {
    const helpText = `
{bold}TaskMaster TUI - Keyboard Shortcuts{/}

{bold}Navigation:{/}
  j, ↓        Move down one task
  k, ↑        Move up one task
  gg          Go to first task
  G           Go to last task
  Ctrl+f      Page down
  Ctrl+b      Page up

{bold}Actions:{/}
  Enter       View task details
  /           Start search
  c           Clear search (when search active)
  r           Refresh task list
  q, Ctrl+c   Quit application
  ?           Show this help

{bold}Search Mode:{/}
  ESC         Exit search
  Enter       Select highlighted task
  n           Next search result
  N           Previous search result
  
{bold}Task Detail View:{/}
  ESC, q      Return to task list

Press any key to close this help...`;

    const helpBox = blessed.message({
      parent: this.app.screen,
      top: "center",
      left: "center",
      width: "60%",
      height: "70%",
      label: " Help ",
      tags: true,
      keys: true,
      vi: true,
      mouse: true,
      border: {
        type: "line",
      },
      style: {
        fg: "white",
        bg: "blue",
        border: {
          fg: "cyan",
        },
      },
    });

    helpBox.display(helpText, () => {
      this.app.render();
    });
  }

  /**
   * Handle escape key based on current context
   */
  handleEscape() {
    if (this.app.currentScreen === this.app.taskDetailScreen) {
      this.app.showTaskList();
    }
    // If in task list, escape does nothing (use 'q' to quit)
  }
}
