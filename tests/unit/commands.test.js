/**
 * Commands module tests
 */

import { jest } from "@jest/globals";
import chalk from "chalk";
import fs from "fs";
import {
  sampleTasks,
  emptySampleTasks,
} from "../../tests/fixtures/sample-tasks.js";

// Mock functions that need jest.fn methods
const mockParsePRD = jest.fn().mockResolvedValue(undefined);
const mockUpdateTaskById = jest.fn().mockResolvedValue({
  id: 2,
  title: "Updated Task",
  description: "Updated description",
});
const mockDisplayBanner = jest.fn();
const mockDisplayHelp = jest.fn();
const mockLog = jest.fn();

// Mock fs and process functions
const mockExistsSync = jest.fn();
const mockConsoleError = jest.fn();
const mockConsoleLog = jest.fn();
const mockExit = jest.fn();

// Mock task manager
const mockTaskManager = {
  addTask: jest.fn().mockResolvedValue({
    success: true,
    taskId: 5,
    message: "Task added successfully"
  })
};

// ...existing code...

  describe("updateTask command", () => {
    // Since mocking Commander is complex, we'll test the action handler directly
    // Recreate the action handler logic based on commands.js
    async function updateTaskAction(options) {
      try {
        const tasksPath = options.file;

        // Validate required parameters
        if (!options.id) {
          mockConsoleError(chalk.red("Error: --id parameter is required"));
          mockConsoleLog(
            chalk.yellow(
              'Usage example: lm-tasker update-task --id=23 (manual updates only)',
            ),
          );
          mockExit(1);
          return; // Add early return to prevent calling updateTaskById
        }

        // Parse the task ID and validate it's a number
        const taskId = parseInt(options.id, 10);
        if (isNaN(taskId) || taskId <= 0) {
          mockConsoleError(
            chalk.red(
              `Error: Invalid task ID: ${options.id}. Task ID must be a positive integer.`,
            ),
          );
          mockConsoleLog(
            chalk.yellow(
              'Usage example: lm-tasker update-task --id=23 (manual updates only)',
            ),
          );
          mockExit(1);
          return; // Add early return to prevent calling updateTaskById
        }

        if (!options.prompt) {
          mockConsoleError(
            chalk.red(
              "Error: Manual updates only. Use the interactive update process.",
            ),
          );
          mockConsoleLog(
            chalk.yellow(
              'Usage example: lm-tasker update-task --id=23 (manual updates only)',
            ),
          );
          mockExit(1);
          return; // Add early return to prevent calling updateTaskById
        }

        const prompt = options.prompt;
        const useResearch = options.research || false;

        // Validate tasks file exists
        if (!mockExistsSync(tasksPath)) {
          mockConsoleError(
            chalk.red(`Error: Tasks file not found at path: ${tasksPath}`),
          );
          if (tasksPath === "tasks/tasks.json") {
            mockConsoleLog(
              chalk.yellow(
                "Hint: Run lm-tasker init or lm-tasker parse-prd to create tasks.json first",
              ),
            );
          } else {
            mockConsoleLog(
              chalk.yellow(
                `Hint: Check if the file path is correct: ${tasksPath}`,
              ),
            );
          }
          mockExit(1);
          return; // Add early return to prevent calling updateTaskById
        }

        mockConsoleLog(
          chalk.blue(`Updating task ${taskId} with prompt: "${prompt}"`),
        );
        mockConsoleLog(chalk.blue(`Tasks file: ${tasksPath}`));

        if (useResearch) {
          // Verify Perplexity API key exists if using research
          if (!process.env.PERPLEXITY_API_KEY) {
            mockConsoleLog(
              chalk.yellow(
                "Warning: PERPLEXITY_API_KEY environment variable is missing. Research-backed updates will not be available.",
              ),
            );
            mockConsoleLog(
              chalk.yellow("Research-backed updates will not be available."),
            );
          } else {
            mockConsoleLog(
              chalk.blue("Using Perplexity AI for research-backed task update"),
            );
          }
        }

        const result = await mockUpdateTaskById(
          tasksPath,
          taskId,
          prompt,
          useResearch,
        );

        // If the task wasn't updated (e.g., if it was already marked as done)
        if (!result) {
          mockConsoleLog(
            chalk.yellow(
              "\nTask update was not completed. Review the messages above for details.",
            ),
          );
        }
      } catch (error) {
        mockConsoleError(chalk.red(`Error: ${error.message}`));

        // Provide more helpful error messages for common issues
        if (
          error.message.includes("task") &&
          error.message.includes("not found")
        ) {
          mockConsoleLog(chalk.yellow("\nTo fix this issue:"));
          mockConsoleLog("  1. Run lm-tasker list to see all available task IDs");
          mockConsoleLog("  2. Use a valid task ID with the --id parameter");
        } else if (error.message.includes("API key")) {
          mockConsoleLog(
            chalk.yellow(
              "\nThis error is related to API keys. Check your environment variables.",
            ),
          );
        }

        if (true) {
          // CONFIG.debug
          mockConsoleError(error);
        }

        mockExit(1);
      }
    }

    beforeEach(() => {
      // Reset all mocks
      jest.clearAllMocks();

      // Set up spy for existsSync (already mocked in the outer scope)
      mockExistsSync.mockReturnValue(true);
    });

    test("should validate required parameters - missing ID", async () => {
      // Set up the command options without ID
      const options = {
        file: "test-tasks.json",
        prompt: "Update the task",
      };

      // Call the action directly
      await updateTaskAction(options);

      // Verify validation error
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining("--id parameter is required"),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
      expect(mockUpdateTaskById).not.toHaveBeenCalled();
    });

    test("should validate required parameters - invalid ID", async () => {
      // Set up the command options with invalid ID
      const options = {
        file: "test-tasks.json",
        id: "not-a-number",
        prompt: "Update the task",
      };

      // Call the action directly
      await updateTaskAction(options);

      // Verify validation error
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining("Invalid task ID"),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
      expect(mockUpdateTaskById).not.toHaveBeenCalled();
    });

    test("should validate required parameters - missing prompt", async () => {
      // Set up the command options without prompt
      const options = {
        file: "test-tasks.json",
        id: "2",
      };

      // Call the action directly
      await updateTaskAction(options);

      // Verify validation error
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining("Manual updates only"),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
      expect(mockUpdateTaskById).not.toHaveBeenCalled();
    });

    test("should validate tasks file exists", async () => {
      // Mock file not existing
      mockExistsSync.mockReturnValue(false);

      // Set up the command options
      const options = {
        file: "missing-tasks.json",
        id: "2",
        prompt: "Update the task",
      };

      // Call the action directly
      await updateTaskAction(options);

      // Verify validation error
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining("Tasks file not found"),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
      expect(mockUpdateTaskById).not.toHaveBeenCalled();
    });

    test("should call updateTaskById with correct parameters", async () => {
      // Set up the command options
      const options = {
        file: "test-tasks.json",
        id: "2",
        prompt: "Update the task",
        research: true,
      };

      // Mock perplexity API key
      process.env.PERPLEXITY_API_KEY = "dummy-key";

      // Call the action directly
      await updateTaskAction(options);

      // Verify updateTaskById was called with correct parameters
      expect(mockUpdateTaskById).toHaveBeenCalledWith(
        "test-tasks.json",
        2,
        "Update the task",
        true,
      );

      // Verify console output
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Updating task 2"),
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Using Perplexity AI"),
      );

      // Clean up
      delete process.env.PERPLEXITY_API_KEY;
    });

    test("should handle null result from updateTaskById", async () => {
      // Mock updateTaskById returning null (e.g., task already completed)
      mockUpdateTaskById.mockResolvedValueOnce(null);

      // Set up the command options
      const options = {
        file: "test-tasks.json",
        id: "2",
        prompt: "Update the task",
      };

      // Call the action directly
      await updateTaskAction(options);

      // Verify updateTaskById was called
      expect(mockUpdateTaskById).toHaveBeenCalled();

      // Verify console output for null result
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Task update was not completed"),
      );
    });

    test("should handle errors from updateTaskById", async () => {
      // Mock updateTaskById throwing an error
      mockUpdateTaskById.mockRejectedValueOnce(new Error("Task update failed"));

      // Set up the command options
      const options = {
        file: "test-tasks.json",
        id: "2",
        prompt: "Update the task",
      };

      // Call the action directly
      await updateTaskAction(options);

      // Verify error handling
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining("Error: Task update failed"),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  // Add test for add-task command
  describe("add-task command", () => {
    let mockTaskManager;
    let addTaskCommand;
    let addTaskAction;
    let mockFs;

    // Import the sample tasks fixtures
    beforeEach(async () => {
      // Mock fs module to return sample tasks
      mockFs = {
        existsSync: jest.fn().mockReturnValue(true),
        readFileSync: jest.fn().mockReturnValue(JSON.stringify(sampleTasks)),
      };

      // Create a mock task manager with an addTask function that resolves to taskId 5
      mockTaskManager = {
        addTask: jest
          .fn()
          .mockImplementation(
            (
              file,
              prompt,
              dependencies,
              priority,
              session,
              research,
              generateFiles,
              manualTaskData,
            ) => {
              // Return the next ID after the last one in sample tasks
              const newId = sampleTasks.tasks.length + 1;
              return Promise.resolve(newId.toString());
            },
          ),
      };

      // Create a simplified version of the add-task action function for testing
      addTaskAction = async (cmd, options) => {
        options = options || {}; // Ensure options is not undefined

        const isManualCreation = options.title && options.description;
        const hasPrompt = options.prompt || options.p;

        // Validate that either manual or prompt-based creation is used
        if (!isManualCreation && !hasPrompt) {
          throw new Error(
            "Either --title and --description (manual) or --prompt/-p (prompt-based) must be provided",
          );
        }

        // Prepare dependencies if provided
        let dependencies = [];
        if (options.dependencies) {
          dependencies = options.dependencies.split(",").map((id) => id.trim());
        }

        // Create manual task data if title and description are provided
        let manualTaskData = null;
        let prompt = undefined;
        let useResearch = false;
        if (isManualCreation) {
          manualTaskData = {
            title: options.title,
            description: options.description,
            details: options.details || "",
            testStrategy: options.testStrategy || "",
          };
        } else if (hasPrompt) {
          prompt = options.prompt || options.p;
          useResearch = options.research || options.r || false;
        }

        // Call addTask with the right parameters
        return await mockTaskManager.addTask(
          options.file || "tasks/tasks.json",
          prompt,
          dependencies,
          options.priority || "medium",
          { session: process.env },
          useResearch,
          null,
          manualTaskData,
        );
      };
    });

    test("should throw error if no manual task data provided", async () => {
      // Call without required params
      const options = { file: "tasks/tasks.json" };

      await expect(async () => {
        await addTaskAction(undefined, options);
      }).rejects.toThrow(
        "Either --title and --description (manual) or --prompt/-p (prompt-based) must be provided",
      );
    });

    test("should handle short-hand flag -p for prompt", async () => {
      // Use -p as prompt short-hand
      const options = {
        p: "Create a login component",
        file: "tasks/tasks.json",
      };

      await addTaskAction(undefined, options);

      // Check that task manager was called with correct arguments
      expect(mockTaskManager.addTask).toHaveBeenCalledWith(
        expect.any(String), // File path
        "Create a login component", // Prompt
        [], // Dependencies
        "medium", // Default priority
        { session: process.env },
        false, // Research flag
        null, // Generate files parameter
        null, // Manual task data
      );
    });

    test("should handle short-hand flag -r for research", async () => {
      const options = {
        prompt: "Create authentication system",
        r: true,
        file: "tasks/tasks.json",
      };

      await addTaskAction(undefined, options);

      // Check that task manager was called with correct research flag
      expect(mockTaskManager.addTask).toHaveBeenCalledWith(
        expect.any(String),
        "Create authentication system",
        [],
        "medium",
        { session: process.env },
        true, // Research flag should be true
        null, // Generate files parameter
        null, // Manual task data
      );
    });

    test("should handle manual task creation with title and description", async () => {
      const options = {
        title: "Login Component",
        description: "Create a reusable login form",
        details: "Implementation details here",
        file: "tasks/tasks.json",
      };

      await addTaskAction(undefined, options);

      // Check that task manager was called with correct manual task data
      expect(mockTaskManager.addTask).toHaveBeenCalledWith(
        expect.any(String),
        undefined, // No prompt for manual creation
        [],
        "medium",
        { session: process.env },
        false,
        null, // Generate files parameter
        {
          // Manual task data
          title: "Login Component",
          description: "Create a reusable login form",
          details: "Implementation details here",
          testStrategy: "",
        },
      );
    });

    test("should handle dependencies parameter", async () => {
      const options = {
        prompt: "Create user settings page",
        dependencies: "1, 3, 5", // Dependencies with spaces
        file: "tasks/tasks.json",
      };

      await addTaskAction(undefined, options);

      // Check that dependencies are parsed correctly
      expect(mockTaskManager.addTask).toHaveBeenCalledWith(
        expect.any(String),
        "Create user settings page",
        ["1", "3", "5"], // Should trim whitespace from dependencies
        "medium",
        { session: process.env },
        false,
        null, // Generate files parameter
        null, // Manual task data
      );
    });

    test("should handle priority parameter", async () => {
      const options = {
        prompt: "Create navigation menu",
        priority: "high",
        file: "tasks/tasks.json",
      };

      await addTaskAction(undefined, options);

      // Check that priority is passed correctly
      expect(mockTaskManager.addTask).toHaveBeenCalledWith(
        expect.any(String),
        "Create navigation menu",
        [],
        "high", // Should use the provided priority
        { session: process.env },
        false,
        null, // Generate files parameter
        null, // Manual task data
      );
    });

    test("should use default values for optional parameters", async () => {
      const options = {
        prompt: "Basic task",
        file: "tasks/tasks.json",
      };

      await addTaskAction(undefined, options);

      // Check that default values are used
      expect(mockTaskManager.addTask).toHaveBeenCalledWith(
        expect.any(String),
        "Basic task",
        [], // Empty dependencies array by default
        "medium", // Default priority is medium
        { session: process.env },
        false, // Research is false by default
        null, // Generate files parameter
        null, // Manual task data
      );
    });
  });

  // Test the version comparison utility
  describe("Version comparison", () => {
    // Use a dynamic import for the commands module
    let compareVersions;

    beforeAll(async () => {
      // Import the function we want to test dynamically
      const commandsModule = await import("../../scripts/modules/commands.js");
      compareVersions = commandsModule.compareVersions;
    });

    test("compareVersions correctly compares semantic versions", () => {
      expect(compareVersions("1.0.0", "1.0.0")).toBe(0);
      expect(compareVersions("1.0.0", "1.0.1")).toBe(-1);
      expect(compareVersions("1.0.1", "1.0.0")).toBe(1);
      expect(compareVersions("1.0.0", "1.1.0")).toBe(-1);
      expect(compareVersions("1.1.0", "1.0.0")).toBe(1);
      expect(compareVersions("1.0.0", "2.0.0")).toBe(-1);
      expect(compareVersions("2.0.0", "1.0.0")).toBe(1);
      expect(compareVersions("1.0", "1.0.0")).toBe(0);
      expect(compareVersions("1.0.0.0", "1.0.0")).toBe(0);
      expect(compareVersions("1.0.0", "1.0.0.1")).toBe(-1);
    });
  });

  // Test the update check functionality
  describe("Update check", () => {
    let displayUpgradeNotification;
    let consoleLogSpy;

    beforeAll(async () => {
      // Import the function we want to test dynamically
      const commandsModule = await import("../../scripts/modules/commands.js");
      displayUpgradeNotification = commandsModule.displayUpgradeNotification;
    });

    beforeEach(() => {
      // Spy on console.log
      consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    test("displays upgrade notification when newer version is available", () => {
      // Test displayUpgradeNotification function
      displayUpgradeNotification("1.0.0", "1.1.0");
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain("Update Available!");
      expect(consoleLogSpy.mock.calls[0][0]).toContain("1.0.0");
      expect(consoleLogSpy.mock.calls[0][0]).toContain("1.1.0");
    });
  });
