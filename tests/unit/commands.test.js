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

        // Validate tasks file exists
        if (!mockExistsSync(tasksPath)) {
          mockConsoleError(
            chalk.red(`Error: Tasks file not found at path: ${tasksPath}`),
          );
          if (tasksPath === "tasks/tasks.json") {
            mockConsoleLog(
              chalk.yellow(
                "Hint: Run 'lm-tasker add-task --title=\"...\" --description=\"...\"' to create your first task",
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

        const result = await mockUpdateTaskById(
          tasksPath,
          taskId,
          prompt,
          false,
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
        if (isManualCreation) {
          manualTaskData = {
            title: options.title,
            description: options.description,
            details: options.details || "",
            testStrategy: options.testStrategy || "",
          };
        } else if (hasPrompt) {
          prompt = options.prompt || options.p;
        }

        // Call addTask with the right parameters
        return await mockTaskManager.addTask(
          options.file || "tasks/tasks.json",
          prompt,
          dependencies,
          options.priority || "medium",
          { session: process.env },
          false,
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

  // Add test for remove-task command
  describe("remove-task command", () => {
    let mockRemoveTask;
    let mockReadJSON;
    let mockTaskExists;
    let mockFindTaskById;
    let mockInquirer;
    let mockStartLoadingIndicator;
    let mockStopLoadingIndicator;
    let mockBoxen;

    beforeEach(async () => {
      // Reset all mocks
      jest.clearAllMocks();

      // Mock the removeTask function
      mockRemoveTask = jest.fn().mockResolvedValue({
        success: true,
        removedTasks: [{ id: 1, title: "Test Task" }],
        message: "Successfully removed task 1",
        error: null
      });

      // Mock readJSON function
      mockReadJSON = jest.fn().mockReturnValue({
        tasks: [
          { id: 1, title: "Test Task", status: "pending", dependencies: [] },
          { id: 2, title: "Another Task", status: "done", dependencies: [1] }
        ]
      });

      // Mock taskExists function
      mockTaskExists = jest.fn().mockReturnValue(true);

      // Mock findTaskById function
      mockFindTaskById = jest.fn().mockReturnValue({
        task: { id: 1, title: "Test Task", status: "pending", isSubtask: false, subtasks: [] }
      });

      // Mock inquirer
      mockInquirer = {
        prompt: jest.fn().mockResolvedValue({ confirm: true })
      };

      // Mock loading indicator functions
      mockStartLoadingIndicator = jest.fn().mockReturnValue("indicator-id");
      mockStopLoadingIndicator = jest.fn();

      // Mock boxen
      mockBoxen = jest.fn().mockReturnValue("formatted message");

      // Mock the modules
      jest.doMock("../../scripts/modules/task-manager/remove-task.js", () => ({
        default: mockRemoveTask
      }));
      jest.doMock("../../scripts/modules/utils.js", () => ({
        ...jest.requireActual("../../scripts/modules/utils.js"),
        readJSON: mockReadJSON,
        findTaskById: mockFindTaskById
      }));
      jest.doMock("../../scripts/modules/task-manager/task-exists.js", () => ({
        default: mockTaskExists
      }));
      jest.doMock("inquirer", () => mockInquirer);
      jest.doMock("../../scripts/modules/ui.js", () => ({
        startLoadingIndicator: mockStartLoadingIndicator,
        stopLoadingIndicator: mockStopLoadingIndicator
      }));
      jest.doMock("boxen", () => mockBoxen);
    });

    // Create a simplified version of the remove-task action function for testing
    async function removeTaskAction(options) {
      const tasksPath = options.file;
      const taskIdsString = options.id;

      if (!taskIdsString) {
        mockConsoleError(chalk.red("Error: Task ID(s) are required"));
        mockConsoleError(
          chalk.yellow(
            "Usage: task-master remove-task --id=<taskId1,taskId2...>",
          ),
        );
        mockExit(1);
        return;
      }

      const taskIdsToRemove = taskIdsString
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);

      if (taskIdsToRemove.length === 0) {
        mockConsoleError(chalk.red("Error: No valid task IDs provided."));
        mockExit(1);
        return;
      }

      try {
        // Read data once for checks and confirmation
        const data = mockReadJSON(tasksPath);
        if (!data || !data.tasks) {
          mockConsoleError(
            chalk.red(`Error: No valid tasks found in ${tasksPath}`),
          );
          mockExit(1);
          return;
        }

        const existingTasksToRemove = [];
        const nonExistentIds = [];

        for (const taskId of taskIdsToRemove) {
          if (!mockTaskExists(data.tasks, taskId)) {
            nonExistentIds.push(taskId);
          } else {
            const findResult = mockFindTaskById(data.tasks, taskId);
            const taskObject = findResult.task;

            if (taskObject) {
              existingTasksToRemove.push({ id: taskId, task: taskObject });
            } else {
              nonExistentIds.push(`${taskId} (error finding details)`);
            }
          }
        }

        if (nonExistentIds.length > 0) {
          mockConsoleLog(
            chalk.yellow(
              `Warning: The following task IDs were not found: ${nonExistentIds.join(", ")}`,
            ),
          );
        }

        if (existingTasksToRemove.length === 0) {
          mockConsoleLog(chalk.blue("No existing tasks found to remove."));
          mockExit(0);
          return;
        }

        // Skip confirmation if --yes flag is provided
        if (!options.yes) {
          mockConsoleLog();
          mockConsoleLog(
            chalk.red.bold(
              `⚠️ WARNING: This will permanently delete the following ${existingTasksToRemove.length} item(s):`,
            ),
          );
          mockConsoleLog();

          existingTasksToRemove.forEach(({ id, task }) => {
            if (!task) return;
            if (task.isSubtask) {
              mockConsoleLog(
                chalk.white(`  Subtask ${id}: ${task.title || "(no title)"}`),
              );
            } else {
              mockConsoleLog(
                chalk.white.bold(`  Task ${id}: ${task.title || "(no title)"}`),
              );
            }
          });

          mockConsoleLog();

          const { confirm } = await mockInquirer.prompt([
            {
              type: "confirm",
              name: "confirm",
              message: chalk.red.bold(
                `Are you sure you want to permanently delete these ${existingTasksToRemove.length} item(s)?`,
              ),
              default: false,
            },
          ]);

          if (!confirm) {
            mockConsoleLog(chalk.blue("Task deletion cancelled."));
            mockExit(0);
            return;
          }
        }

        const indicator = mockStartLoadingIndicator(
          `Removing ${existingTasksToRemove.length} task(s)/subtask(s)...`,
        );

        const existingIdsString = existingTasksToRemove
          .map(({ id }) => id)
          .join(",");
        const result = await mockRemoveTask(tasksPath, existingIdsString);

        mockStopLoadingIndicator(indicator);

        if (result.success) {
          mockConsoleLog(
            mockBoxen(
              chalk.green(
                `Successfully removed ${result.removedTasks.length} task(s)/subtask(s).`,
              ) +
                (result.message ? `\n\nDetails:\n${result.message}` : "") +
                (result.error
                  ? `\n\nWarnings:\n${chalk.yellow(result.error)}`
                  : ""),
              { padding: 1, borderColor: "green", borderStyle: "round" },
            ),
          );
        } else {
          mockConsoleError(
            mockBoxen(
              chalk.red(
                `Operation completed with errors. Removed ${result.removedTasks.length} task(s)/subtask(s).`,
              ) +
                (result.message ? `\n\nDetails:\n${result.message}` : "") +
                (result.error ? `\n\nErrors:\n${chalk.red(result.error)}` : ""),
              {
                padding: 1,
                borderColor: "red",
                borderStyle: "round",
              },
            ),
          );
          mockExit(1);
        }

        if (nonExistentIds.length > 0) {
          mockConsoleLog(
            chalk.yellow(
              `Note: The following IDs were not found initially and were skipped: ${nonExistentIds.join(", ")}`,
            ),
          );

          if (result.removedTasks.length === 0) {
            mockExit(1);
          }
        }
      } catch (error) {
        mockConsoleError(
          chalk.red(`Error: ${error.message || "An unknown error occurred"}`),
        );
        mockExit(1);
      }
    }

    test("should validate required parameters - missing ID", async () => {
      const options = {
        file: "test-tasks.json"
      };

      await removeTaskAction(options);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining("Task ID(s) are required"),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
      expect(mockRemoveTask).not.toHaveBeenCalled();
    });

    test("should validate required parameters - empty ID string", async () => {
      const options = {
        file: "test-tasks.json",
        id: "   ,  ,  "
      };

      await removeTaskAction(options);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining("No valid task IDs provided"),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
      expect(mockRemoveTask).not.toHaveBeenCalled();
    });

    test("should validate tasks file exists and has valid data", async () => {
      mockReadJSON.mockReturnValue(null);

      const options = {
        file: "missing-tasks.json",
        id: "1"
      };

      await removeTaskAction(options);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining("No valid tasks found"),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
      expect(mockRemoveTask).not.toHaveBeenCalled();
    });

    test("should handle non-existent task IDs with warning", async () => {
      mockTaskExists.mockReturnValue(false);

      const options = {
        file: "test-tasks.json",
        id: "999"
      };

      await removeTaskAction(options);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Warning: The following task IDs were not found"),
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("No existing tasks found to remove"),
      );
      expect(mockExit).toHaveBeenCalledWith(0);
      expect(mockRemoveTask).not.toHaveBeenCalled();
    });

    test("should show confirmation prompt when --yes flag is not provided", async () => {
      const options = {
        file: "test-tasks.json",
        id: "1"
      };

      await removeTaskAction(options);

      expect(mockInquirer.prompt).toHaveBeenCalledWith([
        {
          type: "confirm",
          name: "confirm",
          message: expect.stringContaining("Are you sure you want to permanently delete"),
          default: false,
        },
      ]);
      expect(mockRemoveTask).toHaveBeenCalledWith("test-tasks.json", "1");
    });

    test("should skip confirmation when --yes flag is provided", async () => {
      const options = {
        file: "test-tasks.json",
        id: "1",
        yes: true
      };

      await removeTaskAction(options);

      expect(mockInquirer.prompt).not.toHaveBeenCalled();
      expect(mockRemoveTask).toHaveBeenCalledWith("test-tasks.json", "1");
    });

    test("should handle user cancellation of confirmation", async () => {
      mockInquirer.prompt.mockResolvedValueOnce({ confirm: false });

      const options = {
        file: "test-tasks.json",
        id: "1"
      };

      await removeTaskAction(options);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Task deletion cancelled"),
      );
      expect(mockExit).toHaveBeenCalledWith(0);
      expect(mockRemoveTask).not.toHaveBeenCalled();
    });

    test("should call removeTask with correct parameters", async () => {
      const options = {
        file: "test-tasks.json",
        id: "1,2",
        yes: true
      };

      await removeTaskAction(options);

      expect(mockRemoveTask).toHaveBeenCalledWith("test-tasks.json", "1,2");
    });

    test("should display success message when removal succeeds", async () => {
      const options = {
        file: "test-tasks.json",
        id: "1",
        yes: true
      };

      await removeTaskAction(options);

      expect(mockBoxen).toHaveBeenCalledWith(
        expect.stringContaining("Successfully removed 1 task(s)/subtask(s)"),
        expect.objectContaining({
          padding: 1,
          borderColor: "green",
          borderStyle: "round"
        })
      );
      expect(mockConsoleLog).toHaveBeenCalledWith("formatted message");
    });

    test("should display error message when removal fails", async () => {
      mockRemoveTask.mockResolvedValueOnce({
        success: false,
        removedTasks: [],
        message: "No tasks removed",
        error: "Task removal failed"
      });

      const options = {
        file: "test-tasks.json",
        id: "1",
        yes: true
      };

      await removeTaskAction(options);

      expect(mockBoxen).toHaveBeenCalledWith(
        expect.stringContaining("Operation completed with errors"),
        expect.objectContaining({
          padding: 1,
          borderColor: "red",
          borderStyle: "round"
        })
      );
      expect(mockConsoleError).toHaveBeenCalledWith("formatted message");
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    test("should handle mixed success and failure scenarios", async () => {
      mockTaskExists
        .mockReturnValueOnce(true)  // First ID exists
        .mockReturnValueOnce(false); // Second ID doesn't exist

      const options = {
        file: "test-tasks.json",
        id: "1,999",
        yes: true
      };

      await removeTaskAction(options);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Warning: The following task IDs were not found: 999"),
      );
      expect(mockRemoveTask).toHaveBeenCalledWith("test-tasks.json", "1");
    });

    test("should handle errors during removal process", async () => {
      mockReadJSON.mockImplementationOnce(() => {
        throw new Error("File read error");
      });

      const options = {
        file: "test-tasks.json",
        id: "1"
      };

      await removeTaskAction(options);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining("Error: File read error"),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    test("should show loading indicator during removal", async () => {
      const options = {
        file: "test-tasks.json",
        id: "1",
        yes: true
      };

      await removeTaskAction(options);

      expect(mockStartLoadingIndicator).toHaveBeenCalledWith(
        "Removing 1 task(s)/subtask(s)...",
      );
      expect(mockStopLoadingIndicator).toHaveBeenCalledWith("indicator-id");
    });

    test("should handle multiple task IDs correctly", async () => {
      mockTaskExists.mockReturnValue(true);
      mockFindTaskById.mockReturnValue({
        task: { id: 1, title: "Task 1", status: "pending", isSubtask: false, subtasks: [] }
      });

      const options = {
        file: "test-tasks.json",
        id: "1,2,3",
        yes: true
      };

      await removeTaskAction(options);

      expect(mockRemoveTask).toHaveBeenCalledWith("test-tasks.json", "1,2,3");
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
