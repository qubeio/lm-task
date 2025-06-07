/**
 * Theme Configuration
 * Color themes and styling for the TUI
 */

/**
 * Default theme
 */
const defaultTheme = {
  // Border colors
  border: "cyan",

  // Text colors
  text: "white",
  header: "cyan",

  // Selection colors
  selected: "#f4b8e4",
  selectedText: "black",
  selectedBg: "#eebebe",
  selectedFg: "black",

  // Status bar colors
  statusBg: "#81c8be",
  statusText: "black",
  statusBarBg: "#81c8be",
  statusBarFg: "black",

  // Scrollbar colors
  scrollTrack: "gray",

  // Priority colors
  priorityHigh: "red",
  priorityMedium: "yellow",
  priorityLow: "green",

  // Status colors
  statusDone: "green",
  statusInProgress: "yellow",
  statusPending: "blue",
  statusBlocked: "red",
  statusCancelled: "gray",
};

/**
 * Dark theme
 */
const darkTheme = {
  ...defaultTheme,
  border: "gray",
  text: "gray",
  header: "white",
  selected: "gray",
  selectedText: "black",
  selectedBg: "gray",
  selectedFg: "black",
  statusBg: "black",
  statusText: "gray",
  statusBarBg: "black",
  statusBarFg: "gray",
};

/**
 * Light theme
 */
const lightTheme = {
  ...defaultTheme,
  border: "black",
  text: "black",
  header: "blue",
  selected: "white",
  selectedText: "black",
  selectedBg: "white",
  selectedFg: "black",
  statusBg: "white",
  statusText: "black",
  statusBarBg: "white",
  statusBarFg: "black",
};

/**
 * Available themes
 */
const themes = {
  default: defaultTheme,
  dark: darkTheme,
  light: lightTheme,
};

/**
 * Get theme by name
 * @param {string} themeName - Name of the theme
 * @returns {Object} Theme configuration
 */
export function getTheme(themeName = "default") {
  return themes[themeName] || themes.default;
}

/**
 * Get list of available theme names
 * @returns {string[]} Array of theme names
 */
export function getAvailableThemes() {
  return Object.keys(themes);
}
