import { jest } from "@jest/globals";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  isOldFormatPRD,
  isInScriptsDirectory,
  displayDeprecationWarning,
  convertToMarkdown,
  migratePRDFile,
  analyzePRDFiles,
  promptForMigration,
} from "../../scripts/modules/task-manager/migrate-prd.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("PRD Migration Comprehensive Test Suite", () => {
  const testFixturesDir = path.join(__dirname, "..", "fixtures");
  const testOutputDir = path.join(__dirname, "..", "temp");

  beforeEach(() => {
    // Ensure test output directory exists
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testOutputDir)) {
      const files = fs.readdirSync(testOutputDir);
      files.forEach((file) => {
        const filePath = path.join(testOutputDir, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      });
    }
  });

  afterAll(() => {
    // Remove test output directory
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true });
    }
  });

  describe("Old Format Detection", () => {
    describe("isOldFormatPRD", () => {
      test("detects prd.txt files correctly", () => {
        expect(isOldFormatPRD("prd.txt")).toBe(true);
        expect(isOldFormatPRD("/path/to/prd.txt")).toBe(true);
        expect(isOldFormatPRD("scripts/prd.txt")).toBe(true);
        expect(isOldFormatPRD("./scripts/prd.txt")).toBe(true);
      });

      test("does not detect non-prd.txt files", () => {
        expect(isOldFormatPRD("PRD.md")).toBe(false);
        expect(isOldFormatPRD("requirements.txt")).toBe(false);
        expect(isOldFormatPRD("prd.md")).toBe(false);
        expect(isOldFormatPRD("document.txt")).toBe(false);
      });

      test("handles edge cases", () => {
        expect(isOldFormatPRD("")).toBe(false);
        expect(isOldFormatPRD(null)).toBe(false);
        expect(isOldFormatPRD(undefined)).toBe(false);
        expect(isOldFormatPRD("PRD.TXT")).toBe(true); // toLowerCase() makes it case insensitive
      });
    });

    describe("isInScriptsDirectory", () => {
      test("detects scripts directory correctly with full path separators", () => {
        expect(isInScriptsDirectory("/project/scripts/prd.txt")).toBe(true);
        expect(isInScriptsDirectory("/absolute/path/scripts/prd.md")).toBe(true);
        expect(isInScriptsDirectory("/some/deeply/nested/scripts/requirements.txt")).toBe(true);
        expect(isInScriptsDirectory("/path/to/scripts")).toBe(true);
      });

      test("does not detect non-scripts directories", () => {
        expect(isInScriptsDirectory("/project/docs/prd.md")).toBe(false);
        expect(isInScriptsDirectory("./PRD.md")).toBe(false);
        expect(isInScriptsDirectory("/root/prd.txt")).toBe(false);
        expect(isInScriptsDirectory("src/scripts.js")).toBe(false);
        expect(isInScriptsDirectory("scripts")).toBe(false); // Just "scripts" without separator
        expect(isInScriptsDirectory("./scripts/prd.md")).toBe(false); // Relative path - function expects normalized paths
        expect(isInScriptsDirectory("project/scripts/prd.md")).toBe(false); // Relative path without leading separator
      });

      test("handles edge cases", () => {
        expect(isInScriptsDirectory("")).toBe(false);
        expect(isInScriptsDirectory(null)).toBe(false);
        expect(isInScriptsDirectory(undefined)).toBe(false);
      });
    });
  });

  describe("Deprecation Warning Display", () => {
    let consoleSpy;
    let mockLogFn;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, "log").mockImplementation();
      mockLogFn = jest.fn();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    test("displays warning for old format and location (scripts/prd.txt)", () => {
      displayDeprecationWarning("/project/scripts/prd.txt", "text");

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain("DEPRECATION WARNING");
      expect(output).toContain("old PRD format and location");
      expect(output).toContain("task-master migrate-prd");
    });

    test("displays warning for old format only (prd.txt in root)", () => {
      displayDeprecationWarning("prd.txt", "text");

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain("old PRD file format");
      expect(output).toContain("PRD.md");
    });

    test("displays warning for old location only (non-prd.txt in scripts/)", () => {
      displayDeprecationWarning("/project/scripts/requirements.md", "text");

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain("old PRD location");
      expect(output).toContain("PRD.md");
    });

    test("handles JSON output format", () => {
      displayDeprecationWarning("/scripts/prd.txt", "json", mockLogFn);

      expect(consoleSpy).not.toHaveBeenCalled();
      expect(mockLogFn).toHaveBeenCalledWith(
        "warn",
        expect.stringContaining("DEPRECATION WARNING")
      );
    });

    test("does not display warning for new format and location", () => {
      displayDeprecationWarning("PRD.md", "text");

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    test("does not display warning for markdown in root", () => {
      displayDeprecationWarning("/project/PRD.md", "text");

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe("Markdown Conversion", () => {
    test("converts plain text to Markdown", () => {
      const plainText = `Simple Calculator App

Overview:
A basic web calculator that performs arithmetic operations.

Features:
1. Addition and subtraction
2. Multiplication and division
3. Clear functionality

Technical Requirements:
- HTML5, CSS3, JavaScript
- No external dependencies`;

      const markdown = convertToMarkdown(plainText);

      expect(markdown).toContain("# Simple Calculator App");
      expect(markdown).toContain("## Overview");
      expect(markdown).toContain("## Features");
      expect(markdown).toContain("## Technical Requirements");
      expect(markdown).toContain("1. Addition and subtraction");
      expect(markdown).toContain("- HTML5, CSS3, JavaScript");
    });

    test("preserves existing Markdown", () => {
      const existingMarkdown = `# Already Markdown

## Section 1
Content with **bold** text.

### Subsection
- List item`;

      const result = convertToMarkdown(existingMarkdown);

      expect(result).toBe(existingMarkdown);
    });

    test("handles empty or invalid content", () => {
      expect(convertToMarkdown("")).toBe("");
      expect(convertToMarkdown(null)).toBe(null);
      expect(convertToMarkdown(undefined)).toBe(undefined);
    });

    test("adds title if missing", () => {
      const contentWithoutTitle = `This is content without a proper title.

Some more content here.`;

      const result = convertToMarkdown(contentWithoutTitle);

      expect(result).toContain("# Product Requirements Document");
    });

    test("converts section headers correctly", () => {
      const textWithHeaders = `Project Overview

Core Features:
Feature 1
Feature 2

Technical Requirements:
Requirement 1`;

      const result = convertToMarkdown(textWithHeaders);

      expect(result).toContain("# Project Overview");
      expect(result).toContain("## Core Features");
      expect(result).toContain("## Technical Requirements");
    });
  });

  describe("File Migration", () => {
    test("migrates prd.txt to PRD.md successfully", async () => {
      const sourcePath = path.join(testFixturesDir, "legacy-prd.txt");
      const projectRoot = testOutputDir;
      const targetPath = path.join(projectRoot, "PRD.md");

      const result = await migratePRDFile(sourcePath, projectRoot, {
        force: true,
        outputFormat: "json",
        logFn: jest.fn(),
      });

      expect(result.success).toBe(true);
      expect(result.targetPath).toBe(targetPath);
      expect(fs.existsSync(targetPath)).toBe(true);

      const content = fs.readFileSync(targetPath, "utf8");
      expect(content).toContain("# Legacy Blog Platform");
      expect(content).toContain("## Overview");
      expect(content).toContain("<!-- Migrated from");
    });

    test("returns error for existing target file without force", async () => {
      const sourcePath = path.join(testFixturesDir, "legacy-prd.txt");
      const projectRoot = testOutputDir;
      const targetPath = path.join(projectRoot, "PRD.md");

      // Create existing target file
      fs.writeFileSync(targetPath, "# Existing PRD");

      const result = await migratePRDFile(sourcePath, projectRoot, {
        outputFormat: "json",
        logFn: jest.fn(),
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("already exists");
    });

    test("overwrites existing file with force flag", async () => {
      const sourcePath = path.join(testFixturesDir, "legacy-prd.txt");
      const projectRoot = testOutputDir;
      const targetPath = path.join(projectRoot, "PRD.md");

      // Create existing target file
      fs.writeFileSync(targetPath, "# Existing PRD");

      const result = await migratePRDFile(sourcePath, projectRoot, {
        force: true,
        outputFormat: "json",
        logFn: jest.fn(),
      });

      expect(result.success).toBe(true);

      const content = fs.readFileSync(targetPath, "utf8");
      expect(content).toContain("Legacy Blog Platform");
      expect(content).not.toContain("# Existing PRD");
    });

    test("keeps original file by default", async () => {
      const sourcePath = path.join(testOutputDir, "source-prd.txt");
      fs.writeFileSync(sourcePath, "Original content");

      const projectRoot = testOutputDir;

      const result = await migratePRDFile(sourcePath, projectRoot, {
        force: true,
        outputFormat: "json",
        logFn: jest.fn(),
      });

      expect(result.success).toBe(true);
      expect(result.keptOriginal).toBe(true);
      expect(fs.existsSync(sourcePath)).toBe(true);
    });

    test("removes original file when keepOriginal is false", async () => {
      const sourcePath = path.join(testOutputDir, "source-prd.txt");
      fs.writeFileSync(sourcePath, "Original content");

      const projectRoot = testOutputDir;

      const result = await migratePRDFile(sourcePath, projectRoot, {
        force: true,
        keepOriginal: false,
        outputFormat: "json",
        logFn: jest.fn(),
      });

      expect(result.success).toBe(true);
      expect(result.keptOriginal).toBe(false);
      expect(fs.existsSync(sourcePath)).toBe(false);
    });

    test("returns error for non-existent source file", async () => {
      const sourcePath = path.join(testOutputDir, "non-existent.txt");
      const projectRoot = testOutputDir;

      const result = await migratePRDFile(sourcePath, projectRoot, {
        outputFormat: "json",
        logFn: jest.fn(),
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Source PRD file not found");
    });
  });

  describe("PRD File Analysis", () => {
    test("analyzes project directory correctly", () => {
      // Create test files
      const scriptsDir = path.join(testOutputDir, "scripts");
      fs.mkdirSync(scriptsDir, { recursive: true });
      fs.writeFileSync(path.join(scriptsDir, "prd.txt"), "Old PRD content");
      fs.writeFileSync(path.join(testOutputDir, "PRD.md"), "New PRD content");
      fs.writeFileSync(path.join(testOutputDir, "other.txt"), "Other file");

      const analysis = analyzePRDFiles(testOutputDir);

      expect(analysis).toHaveProperty('newFormat');
      expect(analysis).toHaveProperty('oldFormat');
      expect(analysis).toHaveProperty('mixed');
      expect(analysis).toHaveProperty('recommendation');
      
      expect(analysis.newFormat.length).toBeGreaterThan(0);
      expect(analysis.oldFormat.length).toBeGreaterThan(0);
      expect(analysis.mixed).toBe(true);
      expect(analysis.oldFormat.some((f) => f.includes("prd.txt"))).toBe(true);
      expect(analysis.newFormat.some((f) => f.includes("PRD.md"))).toBe(true);
      expect(analysis.recommendation).toContain("Multiple PRD files found");
    });

    test("handles directory with no PRD files", () => {
      // Ensure clean test directory
      if (fs.existsSync(testOutputDir)) {
        fs.rmSync(testOutputDir, { recursive: true, force: true });
      }
      fs.mkdirSync(testOutputDir, { recursive: true });

      // Create some non-PRD files
      fs.writeFileSync(path.join(testOutputDir, "README.md"), "Not a PRD");
      fs.writeFileSync(path.join(testOutputDir, "package.json"), "{}");

      const analysis = analyzePRDFiles(testOutputDir);

      expect(analysis).toHaveProperty('newFormat');
      expect(analysis).toHaveProperty('oldFormat');
      expect(analysis).toHaveProperty('mixed');
      expect(analysis).toHaveProperty('recommendation');
      
      expect(analysis.newFormat).toHaveLength(0);
      expect(analysis.oldFormat).toHaveLength(0);
      expect(analysis.mixed).toBe(false);
      expect(analysis.recommendation).toContain(
        "PRD file structure looks good"
      );
    });

    test("handles non-existent directory", () => {
      const analysis = analyzePRDFiles("/non/existent/path");

      expect(analysis).toHaveProperty('newFormat');
      expect(analysis).toHaveProperty('oldFormat');
      expect(analysis).toHaveProperty('mixed');
      expect(analysis).toHaveProperty('recommendation');
      
      expect(analysis.newFormat).toHaveLength(0);
      expect(analysis.oldFormat).toHaveLength(0);
      expect(analysis.mixed).toBe(false);
    });
  });

  describe("Migration Prompting", () => {
    test("promptForMigration handles user interaction gracefully", async () => {
      // Mock console.log to capture output
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      try {
        const result = await promptForMigration(
          "scripts/prd.txt",
          testOutputDir
        );

        expect(result).toBe(false); // Should return false as per implementation
        expect(consoleSpy).toHaveBeenCalled(); // Should display migration prompt
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe("Integration Scenarios", () => {
    test("complete migration workflow", async () => {
      // Setup: Create old format file
      const scriptsDir = path.join(testOutputDir, "scripts");
      fs.mkdirSync(scriptsDir, { recursive: true });
      const oldPrdPath = path.join(scriptsDir, "prd.txt");
      fs.writeFileSync(
        oldPrdPath,
        `Blog Platform

Overview:
A simple blogging platform.

Features:
1. User authentication
2. Post creation
3. Comment system`
      );

      // Step 1: Analyze files
      const analysis = analyzePRDFiles(testOutputDir);
      expect(analysis.oldFormat.length).toBeGreaterThan(0);
      expect(analysis.newFormat.length).toBe(0);

      // Step 2: Migrate file
      const result = await migratePRDFile(oldPrdPath, testOutputDir, {
        force: true,
        outputFormat: "json",
        logFn: jest.fn(),
      });

      expect(result.success).toBe(true);

      // Step 3: Verify migration
      const newAnalysis = analyzePRDFiles(testOutputDir);
      expect(newAnalysis.newFormat.length).toBeGreaterThan(0);

      const newContent = fs.readFileSync(result.targetPath, "utf8");
      expect(newContent).toContain("# Blog Platform");
      expect(newContent).toContain("## Overview");
      expect(newContent).toContain("## Features");
      expect(newContent).toContain("1. User authentication");
    });

    test("handles multiple old format files", async () => {
      // Create multiple old format files
      const scriptsDir = path.join(testOutputDir, "scripts");
      fs.mkdirSync(scriptsDir, { recursive: true });

      fs.writeFileSync(path.join(scriptsDir, "prd.txt"), "Old PRD 1");
      fs.writeFileSync(path.join(testOutputDir, "prd.txt"), "Old PRD 2");
      fs.writeFileSync(
        path.join(testOutputDir, "requirements.txt"),
        "Not a PRD"
      );

      const analysis = analyzePRDFiles(testOutputDir);

      expect(analysis.oldFormat.length).toBeGreaterThan(0);
      expect(analysis.oldFormat.some((f) => f.includes("scripts"))).toBe(true);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    test("handles permission errors gracefully", async () => {
      const sourcePath = path.join(testFixturesDir, "legacy-prd.txt");
      const readOnlyDir = path.join(testOutputDir, "readonly");

      // Create directory and make it read-only (if possible)
      fs.mkdirSync(readOnlyDir, { recursive: true });

      try {
        fs.chmodSync(readOnlyDir, 0o444);

        const result = await migratePRDFile(sourcePath, readOnlyDir, {
          outputFormat: "json",
          logFn: jest.fn(),
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("permission denied");
      } catch (error) {
        // If chmod fails (e.g., on Windows), skip this test
        if (error.code !== "EPERM") {
          throw error;
        }
      } finally {
        // Restore permissions for cleanup
        try {
          fs.chmodSync(readOnlyDir, 0o755);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    });

    test("handles very large files", async () => {
      const largePrdPath = path.join(testOutputDir, "large-prd.txt");
      const largeContent = "Large PRD Content\n".repeat(10000);
      fs.writeFileSync(largePrdPath, largeContent);

      const result = await migratePRDFile(largePrdPath, testOutputDir, {
        force: true,
        outputFormat: "json",
        logFn: jest.fn(),
      });

      expect(result.success).toBe(true);

      const migratedContent = fs.readFileSync(result.targetPath, "utf8");
      expect(migratedContent.length).toBeGreaterThan(largeContent.length); // Should include migration header
    });

    test("handles files with special characters", async () => {
      const specialPrdPath = path.join(testOutputDir, "special-prd.txt");
      const specialContent = `PRD with Special Characters

Content with émojis 🚀 and ünïcödé characters.
Also includes "quotes" and 'apostrophes'.

Code examples:
const example = "Hello, 世界!";`;

      fs.writeFileSync(specialPrdPath, specialContent, "utf8");

      const result = await migratePRDFile(specialPrdPath, testOutputDir, {
        force: true,
        outputFormat: "json",
        logFn: jest.fn(),
      });

      expect(result.success).toBe(true);

      const migratedContent = fs.readFileSync(result.targetPath, "utf8");
      expect(migratedContent).toContain("🚀");
      expect(migratedContent).toContain("ünïcödé");
      expect(migratedContent).toContain("世界");
    });
  });
});
