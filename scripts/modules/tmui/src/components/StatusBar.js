/**
 * Status Bar Component
 * Displays keyboard shortcuts and task statistics at the bottom of the screen
 */

import blessed from "blessed";

export class StatusBar {
  constructor(screen) {
    this.screen = screen;
    this.app = screen.app;
    this.statusBar = null;
    this.messageTimeout = null; // Track message timeout for cleanup
    this.stats = {
      total: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
    };

    this.createStatusBar();
  }

  /**
   * Create the status bar widget
   */
  createStatusBar() {
    this.statusBar = blessed.box({
      parent: this.screen.getContainer(),
      bottom: 0,
      left: 0,
      width: "100%",
      height: 1,
      style: {
        fg: this.app.theme.statusText,
        bg: this.app.theme.statusBg,
        bold: true,
      },
      tags: true,
    });

    this.updateDisplay();
  }

  /**
   * Update task statistics
   */
  updateStats(stats) {
    this.stats = stats;
    this.updateDisplay();
  }

  /**
   * Update the status bar display
   */
  updateDisplay() {
    const shortcuts = this.getKeyboardShortcuts();
    const statsText = this.getStatsText();

    // Calculate available space
    const totalWidth = this.statusBar.width - 2; // Account for padding
    const shortcutsWidth = shortcuts.length;
    const statsWidth = statsText.length;
    const spacingNeeded = totalWidth - shortcutsWidth - statsWidth;

    let content;
    if (spacingNeeded > 0) {
      // Enough space for both shortcuts and stats
      const spacing = " ".repeat(spacingNeeded);
      content = `${shortcuts}${spacing}${statsText}`;
    } else {
      // Not enough space, prioritize shortcuts
      content = shortcuts;
    }

    this.statusBar.setContent(content);
  }

  /**
   * Get keyboard shortcuts text
   */
  getKeyboardShortcuts() {
    const autoRefreshIndicator = this.app.options.autoRefresh
      ? " {dim}●{/}"
      : "";

    if (this.app.searchMode) {
      return ` {bold}ESC{/}: close search │ {bold}Enter{/}: select │ {bold}n/N{/}: next/prev match${autoRefreshIndicator} `;
    } else {
      return ` {bold}j/k{/}: up/down │ {bold}s{/}: update status │ {bold}/{/}: search │ {bold}Enter{/}: details │ {bold}r{/}: refresh │ {bold}q{/}: quit │ {bold}?{/}: help${autoRefreshIndicator} `;
    }
  }

  /**
   * Get task statistics text
   */
  getStatsText() {
    const { total, completed, inProgress, pending } = this.stats;

    if (total === 0) {
      return " No tasks ";
    }

    const parts = [];

    if (completed > 0) {
      parts.push(`{green-fg}✅ ${completed}{/}`);
    }

    if (inProgress > 0) {
      parts.push(`{yellow-fg}🔄 ${inProgress}{/}`);
    }

    if (pending > 0) {
      parts.push(`{blue-fg}⏳ ${pending}{/}`);
    }

    const statsText = parts.join(" │ ");
    return ` ${statsText} │ Total: ${total} `;
  }

  /**
   * Set status message (for temporary messages)
   */
  setMessage(message, duration = 3000) {
    // Clear any existing message timeout
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
      this.messageTimeout = null;
    }

    const originalContent = this.statusBar.getContent();

    this.statusBar.setContent(` ${message} `);
    this.app.render();

    // Restore original content after duration
    this.messageTimeout = setTimeout(() => {
      this.messageTimeout = null;
      this.updateDisplay();
      this.app.render();
    }, duration);
  }

  /**
   * Clear any pending message timeout
   */
  clearMessage() {
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
      this.messageTimeout = null;
      this.updateDisplay();
      this.app.render();
    }
  }

  /**
   * Get the status bar widget
   */
  getWidget() {
    return this.statusBar;
  }
}
