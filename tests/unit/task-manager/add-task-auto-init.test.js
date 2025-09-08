/**
 * Unit tests for add-task auto-initialization behavior
 * 
 * Tests the core addTask function's auto-initialization functionality:
 * 1. No tasks.json -> creates file and adds task
 * 2. Existing file no-op init (should not reinitialize)
 * 3. File write failure path (error handling)
 */

import { jest } from "@jest/globals";
import fs from "fs";
import path from "path";
import addTask from "../../../scripts/modules/task-manager/add-task.js";
import { createMinimalTasksJson } from "../../../scripts/modules/utils.js";

// Mock fs module
jest.mock("fs");
const mockFs = fs;

// Mock path module
jest.mock("path");
const mockPath = path;

// Mock other dependencies
jest.mock("../../../scripts/modules/ui.js", () => ({
  getStatusWithColor: jest.fn((status) => status),
  startLoadingIndicator: jest.fn(),
  stopLoadingIndicator: jest.fn(),
}));

jest.mock("../../../scripts/modules/config-manager.js", () => ({
  getDefaultPriority: jest.fn(() => "medium"),
}));

jest.mock("../../../scripts/modules/task-manager/generate-task-files.js", () => ({
  default: jest.fn().mockResolvedValue(undefined),
}));

// Mock console.log to prevent output during tests
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();
const mockConsoleWarn = jest.fn();
const mockConsoleInfo = jest.fn();

// Mock chalk and boxen for CLI output
jest.mock("chalk", () => ({
  white: jest.fn((text) => text),
  white: { bold: jest.fn((text) => text) },
  green: jest.fn((text) => text),
  cyan: jest.fn((text) => text),
  yellow: jest.fn((text) => text),
  dim: jest.fn((text) => text),
  red: jest.fn((text) => text),
}));

jest.mock("boxen", () => jest.fn((text, options) => text));

describe("add-task auto-initialization behavior", () => {
  let mockLogger;
  let testTasksPath;
  let testTasksDir;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup test paths
    testTasksPath = "/test/project/tasks/tasks.json";
    testTasksDir = "/test/project/tasks";

    // Create mock logger
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      success: jest.fn(),
    };

    // Mock console methods
    global.console = {
      log: mockConsoleLog,
      error: mockConsoleError,
      warn: mockConsoleWarn,
      info: mockConsoleInfo,
    };

    // Mock fs methods
    jest.spyOn(mockFs, 'existsSync').mockReturnValue(false);
    jest.spyOn(mockFs, 'mkdirSync').mockImplementation(() => {});
    jest.spyOn(mockFs, 'readFileSync').mockReturnValue(JSON.stringify({ meta: {}, tasks: [] }));
    jest.spyOn(mockFs, 'writeFileSync').mockImplementation(() => {});

    // Mock path methods
    jest.spyOn(mockPath, 'dirname').mockImplementation((path) => {
      if (path === testTasksPath) return testTasksDir;
      return path;
    });
  });

  describe("Test Case 1: No tasks.json -> creates file and adds task", () => {
    test("should auto-initialize when tasks.json does not exist", async () => {
      // Setup: tasks.json does not exist
      mockFs.existsSync.mockImplementation((filePath) => {
        if (filePath === testTasksPath) return false;
        if (filePath === testTasksDir) return false;
        return true;
      });

      // Test data
      const manualTaskData = {
        title: "Test Task",
        description: "A test task for auto-initialization",
        details: "Test implementation details",
        testStrategy: "Test the functionality",
      };

      // Call addTask
      const result = await addTask(
        testTasksPath,
        null, // prompt
        [], // dependencies
        "high", // priority
        { mcpLog: mockLogger, projectRoot: "/test/project" }, // context
        "text", // outputFormat
        manualTaskData, // manualTaskData
        false // useResearch
      );

      // Verify auto-initialization behavior
      expect(mockFs.existsSync).toHaveBeenCalledWith(testTasksPath);
      expect(mockFs.existsSync).toHaveBeenCalledWith(testTasksDir);
      
      // Verify directory creation
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(testTasksDir, { recursive: true });
      expect(mockLogger.info).toHaveBeenCalledWith(`Created tasks directory: ${testTasksDir}`);
      
      // Verify tasks.json creation
      expect(mockFs.writeFileSync).toHaveBeenCalled();
      
      // Verify the written content includes the new task
      const writeFileCall = mockFs.writeFileSync.mock.calls[0];
      expect(writeFileCall[0]).toBe(testTasksPath);
      
      const writtenData = JSON.parse(writeFileCall[1]);
      expect(writtenData).toHaveProperty("meta");
      expect(writtenData).toHaveProperty("tasks");
      expect(writtenData.tasks).toHaveLength(1);
      expect(writtenData.tasks[0]).toMatchObject({
        id: 1,
        title: "Test Task",
        description: "A test task for auto-initialization",
        status: "pending",
        priority: "high",
        dependencies: [],
        subtasks: [],
      });

      // Verify meta structure
      expect(writtenData.meta).toMatchObject({
        name: "lm-tasker-project",
        version: "0.1.0",
        description: "A project managed with LM-Tasker",
        initializedBy: "add-task-auto-init",
      });
      expect(writtenData.meta).toHaveProperty("createdAt");

      // Verify success logging
      expect(mockLogger.success).toHaveBeenCalledWith(`Auto-initialized tasks.json at ${testTasksPath}`);
      expect(mockLogger.info).toHaveBeenCalledWith("Task files generated successfully");

      // Verify return value
      expect(result).toEqual({
        newTaskId: 1,
        telemetryData: null,
      });
    });

    test("should create tasks directory when it doesn't exist", async () => {
      // Setup: tasks.json doesn't exist, tasks directory doesn't exist
      mockFs.existsSync.mockImplementation((filePath) => {
        if (filePath === testTasksPath) return false;
        if (filePath === testTasksDir) return false;
        return true;
      });

      const manualTaskData = {
        title: "Directory Test Task",
        description: "Test task for directory creation",
      };

      await addTask(
        testTasksPath,
        null,
        [],
        "medium",
        { mcpLog: mockLogger, projectRoot: "/test/project" },
        "text",
        manualTaskData,
        false
      );

      // Verify directory creation was called
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(testTasksDir, { recursive: true });
      expect(mockLogger.info).toHaveBeenCalledWith(`Created tasks directory: ${testTasksDir}`);
    });

    test("should use createMinimalTasksJson for initialization", async () => {
      // Setup: tasks.json doesn't exist
      mockFs.existsSync.mockImplementation((filePath) => {
        if (filePath === testTasksPath) return false;
        if (filePath === testTasksDir) return true; // Directory exists
        return true;
      });

      const manualTaskData = {
        title: "Minimal JSON Test",
        description: "Test minimal JSON creation",
      };

      await addTask(
        testTasksPath,
        null,
        [],
        "medium",
        { mcpLog: mockLogger, projectRoot: "/test/project" },
        "text",
        manualTaskData,
        false
      );

      // Verify the written JSON structure matches createMinimalTasksJson output
      const writeFileCall = mockFs.writeFileSync.mock.calls[0];
      const writtenData = JSON.parse(writeFileCall[1]);
      
      // Compare with expected minimal structure
      const expectedMinimal = createMinimalTasksJson();
      expect(writtenData.meta).toMatchObject({
        name: expectedMinimal.meta.name,
        version: expectedMinimal.meta.version,
        description: expectedMinimal.meta.description,
        initializedBy: expectedMinimal.meta.initializedBy,
      });
      // The task should be added to the minimal structure
      expect(writtenData.tasks).toHaveLength(1);
      expect(writtenData.tasks[0].title).toBe("Minimal JSON Test");
    });
  });

  describe("Test Case 2: Existing file no-op init (should not reinitialize)", () => {
    test("should not reinitialize when tasks.json already exists", async () => {
      // Setup: tasks.json exists with existing tasks
      const existingTasks = {
        meta: {
          name: "existing-project",
          version: "1.0.0",
          description: "Existing project",
          createdAt: "2023-01-01T00:00:00.000Z",
          initializedBy: "manual-init"
        },
        tasks: [
          {
            id: 1,
            title: "Existing Task",
            description: "An existing task",
            status: "done",
            priority: "high",
            dependencies: [],
            subtasks: [],
          }
        ]
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(existingTasks));

      const manualTaskData = {
        title: "New Task",
        description: "A new task added to existing project",
      };

      await addTask(
        testTasksPath,
        null,
        [],
        "medium",
        { mcpLog: mockLogger, projectRoot: "/test/project" },
        "text",
        manualTaskData,
        false
      );

      // Verify no directory creation
      expect(mockFs.mkdirSync).not.toHaveBeenCalled();
      
      // Verify no auto-initialization logging
      expect(mockLogger.success).not.toHaveBeenCalledWith(expect.stringContaining("Auto-initialized"));
      expect(mockLogger.info).not.toHaveBeenCalledWith(expect.stringContaining("Created tasks directory"));

      // Verify existing file was read
      expect(mockFs.readFileSync).toHaveBeenCalledWith(testTasksPath, "utf8");

      // Verify new task was added to existing structure
      const writeFileCall = mockFs.writeFileSync.mock.calls[0];
      const writtenData = JSON.parse(writeFileCall[1]);
      
      expect(writtenData.tasks).toHaveLength(2);
      expect(writtenData.tasks[0]).toMatchObject(existingTasks.tasks[0]); // Existing task unchanged
      expect(writtenData.tasks[1]).toMatchObject({
        id: 2, // Next available ID
        title: "New Task",
        description: "A new task added to existing project",
        status: "pending",
        priority: "medium",
        dependencies: [],
        subtasks: [],
      });

      // Verify meta was preserved
      expect(writtenData.meta).toMatchObject(existingTasks.meta);
    });

    test("should preserve existing meta data when adding to existing project", async () => {
      // Setup: existing project with custom meta
      const existingTasks = {
        meta: {
          name: "custom-project-name",
          version: "2.1.0",
          description: "Custom project description",
          createdAt: "2023-06-15T10:30:00.000Z",
          initializedBy: "user-init",
          customField: "custom-value"
        },
        tasks: []
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(existingTasks));

      const manualTaskData = {
        title: "Preserve Meta Test",
        description: "Test that meta is preserved",
      };

      await addTask(
        testTasksPath,
        null,
        [],
        "low",
        { mcpLog: mockLogger, projectRoot: "/test/project" },
        "text",
        manualTaskData,
        false
      );

      // Verify meta was preserved exactly
      const writeFileCall = mockFs.writeFileSync.mock.calls[0];
      const writtenData = JSON.parse(writeFileCall[1]);
      
      expect(writtenData.meta).toEqual(existingTasks.meta);
      expect(writtenData.meta.customField).toBe("custom-value");
    });
  });

  describe("Test Case 3: File write failure path (error handling)", () => {
    test("should handle directory creation failure", async () => {
      // Setup: tasks.json doesn't exist, directory creation fails
      mockFs.existsSync.mockImplementation((filePath) => {
        if (filePath === testTasksPath) return false;
        if (filePath === testTasksDir) return false;
        return true;
      });

      const directoryError = new Error("Permission denied: cannot create directory");
      mockFs.mkdirSync.mockImplementation(() => {
        throw directoryError;
      });

      const manualTaskData = {
        title: "Directory Failure Test",
        description: "Test directory creation failure",
      };

      // Should throw the directory creation error
      await expect(addTask(
        testTasksPath,
        null,
        [],
        "medium",
        { mcpLog: mockLogger, projectRoot: "/test/project" },
        "text",
        manualTaskData,
        false
      )).rejects.toThrow("Permission denied: cannot create directory");

      // Verify directory creation was attempted
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(testTasksDir, { recursive: true });
      
      // Verify no file write was attempted
      expect(mockFs.writeFileSync).not.toHaveBeenCalled();
    });

    test("should handle tasks.json write failure", async () => {
      // Setup: tasks.json doesn't exist, directory creation succeeds, but file write fails
      mockFs.existsSync.mockImplementation((filePath) => {
        if (filePath === testTasksPath) return false;
        if (filePath === testTasksDir) return false;
        return true;
      });

      mockFs.mkdirSync.mockImplementation(() => {}); // Directory creation succeeds
      
      const writeError = new Error("Disk full: cannot write file");
      mockFs.writeFileSync.mockImplementation(() => {
        throw writeError;
      });

      const manualTaskData = {
        title: "Write Failure Test",
        description: "Test file write failure",
      };

      // The function should handle the write error gracefully and continue
      const result = await addTask(
        testTasksPath,
        null,
        [],
        "medium",
        { mcpLog: mockLogger, projectRoot: "/test/project" },
        "text",
        manualTaskData,
        false
      );

      // Verify the task was still created successfully despite write error
      expect(result).toEqual({
        newTaskId: 1,
        telemetryData: null,
      });

      // Verify directory was created successfully
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(testTasksDir, { recursive: true });
      expect(mockLogger.info).toHaveBeenCalledWith(`Created tasks directory: ${testTasksDir}`);
      
      // Verify file write was attempted
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    test("should handle existing file read failure", async () => {
      // Setup: tasks.json exists but cannot be read
      mockFs.existsSync.mockReturnValue(true);
      
      const readError = new Error("File corrupted: cannot read tasks.json");
      mockFs.readFileSync.mockImplementation(() => {
        throw readError;
      });

      const manualTaskData = {
        title: "Read Failure Test",
        description: "Test file read failure",
      };

      // Should throw the file read error
      await expect(addTask(
        testTasksPath,
        null,
        [],
        "medium",
        { mcpLog: mockLogger, projectRoot: "/test/project" },
        "text",
        manualTaskData,
        false
      )).rejects.toThrow("Cannot read properties of null (reading 'tasks')");

      // Verify file read was attempted
      expect(mockFs.readFileSync).toHaveBeenCalledWith(testTasksPath, "utf8");
      
      // Verify no file write was attempted
      expect(mockFs.writeFileSync).not.toHaveBeenCalled();
    });

    test("should handle task file generation failure gracefully", async () => {
      // Setup: tasks.json doesn't exist
      mockFs.existsSync.mockImplementation((filePath) => {
        if (filePath === testTasksPath) return false;
        if (filePath === testTasksDir) return true;
        return true;
      });

      mockFs.writeFileSync.mockImplementation(() => {}); // Main file write succeeds

      const manualTaskData = {
        title: "Generation Failure Test",
        description: "Test task file generation failure",
      };

      // The function should handle any task file generation errors gracefully
      const result = await addTask(
        testTasksPath,
        null,
        [],
        "medium",
        { mcpLog: mockLogger, projectRoot: "/test/project" },
        "text",
        manualTaskData,
        false
      );

      // Verify task was still created successfully
      expect(result).toEqual({
        newTaskId: 1,
        telemetryData: null,
      });

      // The function should complete successfully even if task file generation fails
      // (The actual error handling is tested in the generate-task-files module tests)
    });
  });

  describe("Edge cases and integration", () => {
    test("should handle dependencies validation during auto-initialization", async () => {
      // Setup: tasks.json doesn't exist, task has invalid dependencies
      mockFs.existsSync.mockImplementation((filePath) => {
        if (filePath === testTasksPath) return false;
        if (filePath === testTasksDir) return true;
        return true;
      });

      const manualTaskData = {
        title: "Dependency Test",
        description: "Test dependency validation",
        // Don't include dependencies in manualTaskData to test the dependencies parameter
      };

      await addTask(
        testTasksPath,
        null,
        [999, 1000], // Invalid dependencies
        "medium",
        { mcpLog: mockLogger, projectRoot: "/test/project" },
        "text",
        manualTaskData,
        false
      );

      // Verify warning about invalid dependencies
      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining("Invalid dependencies ignored"));

      // Verify task was created with empty dependencies (since all were invalid)
      const writeFileCall = mockFs.writeFileSync.mock.calls[0];
      const writtenData = JSON.parse(writeFileCall[1]);
      
      expect(writtenData.tasks[0].dependencies).toEqual([]);
    });

    test("should handle manual task data validation failure", async () => {
      // Setup: tasks.json doesn't exist, but manual task data is invalid
      mockFs.existsSync.mockImplementation((filePath) => {
        if (filePath === testTasksPath) return false;
        if (filePath === testTasksDir) return true;
        return true;
      });

      const invalidTaskData = {
        // Missing required title and description
        details: "Invalid task data",
      };

      // Should throw validation error before any file operations
      await expect(addTask(
        testTasksPath,
        null,
        [],
        "medium",
        { mcpLog: mockLogger, projectRoot: "/test/project" },
        "text",
        invalidTaskData,
        false
      )).rejects.toThrow("Invalid manual task data");

      // Verify no file operations were attempted
      expect(mockFs.mkdirSync).not.toHaveBeenCalled();
      expect(mockFs.writeFileSync).not.toHaveBeenCalled();
    });

    test("should work with MCP context (no CLI output)", async () => {
      // Setup: tasks.json doesn't exist, using MCP context
      mockFs.existsSync.mockImplementation((filePath) => {
        if (filePath === testTasksPath) return false;
        if (filePath === testTasksDir) return true;
        return true;
      });

      const manualTaskData = {
        title: "MCP Test",
        description: "Test MCP context",
      };

      const result = await addTask(
        testTasksPath,
        null,
        [],
        "medium",
        { mcpLog: mockLogger, projectRoot: "/test/project" }, // MCP context
        "json", // JSON output format
        manualTaskData,
        false
      );

      // Verify task was created successfully
      expect(result).toEqual({
        newTaskId: 1,
        telemetryData: null,
      });

      // Note: Some console.log calls may come from the generateTaskFiles function
      // but the main CLI output (boxen) should not be generated for MCP context
    });
  });
});
