/**
 * Search Screen
 * Screen component for search functionality
 */

import blessed from "blessed";

export class SearchScreen {
  constructor(app) {
    this.app = app;
    this.searchBox = null;
    this.query = "";
    this.searchTimeout = null; // Add debouncing for search

    this.createComponents();
  }

  /**
   * Create the search components
   */
  createComponents() {
    // Search input box
    this.searchBox = blessed.textbox({
      parent: this.app.screen,
      bottom: 0,
      left: 0,
      width: "100%",
      height: 3,
      border: {
        type: "line",
      },
      style: {
        border: {
          fg: this.app.theme.border,
        },
        focus: {
          border: {
            fg: this.app.theme.selected,
          },
        },
      },
      label: " Search ",
      tags: true,
      keys: true,
      mouse: true,
      inputOnFocus: true,
    });

    // Set up event handlers
    this.setupEventHandlers();
  }

  /**
   * Setup event handlers for search
   */
  setupEventHandlers() {
    // Handle search input
    this.searchBox.on("submit", (value) => {
      this.query = value || "";
      this.app.performSearch(this.query);
      this.app.focusTaskList();
    });

    // Handle escape key
    this.searchBox.key("escape", () => {
      this.app.focusTaskList();
    });

    // Handle real-time search as user types
    this.searchBox.on("keypress", (ch, key) => {
      // Clear previous timeout
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }

      // Debounce search to reduce render frequency
      this.searchTimeout = setTimeout(() => {
        const currentValue = this.searchBox.getValue();
        if (currentValue !== this.query) {
          this.query = currentValue;
          this.app.performSearch(this.query);
        }
      }, 150); // Increased delay to reduce render frequency
    });
  }

  /**
   * Hide the search screen
   */
  hide() {
    // Clear any pending search timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = null;
    }

    this.searchBox.hide();
    this.app.focusTaskList();
    this.app.render();
  }

  /**
   * Focus the search input
   */
  focus() {
    this.searchBox.focus();
    this.app.render();
  }

  /**
   * Clear the search query
   */
  clear() {
    // Clear any pending search timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = null;
    }

    this.query = "";
    this.searchBox.setValue("");
  }
}
