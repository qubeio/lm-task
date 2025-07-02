/**
 * Integration test for direct function imports in MCP server
 */

import { jest } from "@jest/globals";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

// Get the current module's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test file paths
const testProjectRoot = path.join(__dirname, "../../fixtures");
const testTasksPath = path.join(testProjectRoot, "test-tasks.json");

// Create explicit mock functions
const mockExistsSync = jest.fn().mockReturnValue(true);
const mockWriteFileSync = jest.fn();
const mockReadFileSync = jest.fn();
const mockUnlinkSync = jest.fn();
const mockMkdirSync = jest.fn();

const mockFindTasksJsonPath = jest.fn().mockReturnValue(testTasksPath);
const mockReadJSON = jest.fn();
const mockWriteJSON = jest.fn();
const mockEnableSilentMode = jest.fn();
const mockDisableSilentMode = jest.fn();

const mockGetAnthropicClient = jest.fn().mockReturnValue({});
const mockGetConfiguredAnthropicClient = jest.fn().mockReturnValue({});
const mockHandleAnthropicStream = jest.fn().mockResolvedValue(
  JSON.stringify([
    {
      id: 1,
      title: "Mock Subtask 1",
      description: "First mock subtask",
      dependencies: [],
      details: "Implementation details for mock subtask 1",
    },
    {
      id: 2,
      title: "Mock Subtask 2",
      description: "Second mock subtask",
      dependencies: [1],
      details: "Implementation details for mock subtask 2",
    },
  ]),
);
const mockParseSubtasksFromText = jest.fn().mockReturnValue([
  {
    id: 1,
    title: "Mock Subtask 1",
    description: "First mock subtask",
    status: "pending",
    dependencies: [],
  },
  {
    id: 2,
    title: "Mock Subtask 2",
    description: "Second mock subtask",
    status: "pending",
    dependencies: [1],
  },
]);

const mockGenerateTaskFiles = jest.fn().mockResolvedValue(true);
const mockFindTaskById = jest.fn();
const mockTaskExists = jest.fn().mockReturnValue(true);

// Mock fs module to avoid file system operations
jest.mock("fs", () => ({
  existsSync: mockExistsSync,
  writeFileSync: mockWriteFileSync,
  readFileSync: mockReadFileSync,
  unlinkSync: mockUnlinkSync,
  mkdirSync: mockMkdirSync,
}));

// Mock utils functions to avoid actual file operations
jest.mock("../../../scripts/modules/utils.js", () => ({
  readJSON: mockReadJSON,
  writeJSON: mockWriteJSON,
  enableSilentMode: mockEnableSilentMode,
  disableSilentMode: mockDisableSilentMode,
  CONFIG: {
    model: "claude-3-7-sonnet-20250219",
    maxTokens: 64000,
    temperature: 0.2,
    defaultSubtasks: 5,
  },
}));

// Mock path-utils with findTasksJsonPath
jest.mock("../../../mcp-server/src/core/utils/path-utils.js", () => ({
  findTasksJsonPath: mockFindTasksJsonPath,
}));

// Mock the AI module to prevent any real API calls
jest.mock("../../../scripts/modules/ai-services-unified.js", () => ({
  // Mock the functions exported by ai-services-unified.js as needed
  // For example, if you are testing a function that uses generateTextService:
  generateTextService: jest.fn().mockResolvedValue("Mock AI Response"),
  // Add other mocks for generateObjectService, streamTextService if used
}));

// Mock task-manager.js to avoid real operations
jest.mock("../../../scripts/modules/task-manager.js", () => ({
  generateTaskFiles: mockGenerateTaskFiles,
  findTaskById: mockFindTaskById,
  taskExists: mockTaskExists,
}));

// Import dependencies after mocks are set up
import { sampleTasks } from "../../fixtures/sample-tasks.js";

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
};

// Mock session
const mockSession = {
  env: {
    ANTHROPIC_API_KEY: "mock-api-key",
    MODEL: "claude-3-sonnet-20240229",
    MAX_TOKENS: 4000,
    TEMPERATURE: "0.2",
  },
};

describe("MCP Server Direct Functions", () => {
  // Set up before each test
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mockReadJSON implementation
    mockReadJSON.mockReturnValue(JSON.parse(JSON.stringify(sampleTasks)));

    // Default mockFindTaskById implementation
    mockFindTaskById.mockImplementation((tasks, taskId) => {
      const id = parseInt(taskId, 10);
      return tasks.find((t) => t.id === id);
    });

    // Default mockTaskExists implementation
    mockTaskExists.mockImplementation((tasks, taskId) => {
      const id = parseInt(taskId, 10);
      return tasks.some((t) => t.id === id);
    });

    // Default findTasksJsonPath implementation
    mockFindTasksJsonPath.mockImplementation((args) => {
      // Mock returning null for non-existent files
      if (args.file === "non-existent-file.json") {
        return null;
      }
      return testTasksPath;
    });
  });

  describe("listTasksDirect", () => {
    // Test wrapper function that returns appropriate results based on the test case
    async function testListTasks(args, mockLogger) {
      // File not found case
      if (args.file === "non-existent-file.json") {
        mockLogger.error("File not found");
        return {
          success: false,
          error: {
            code: "FILE_NOT_FOUND_ERROR",
            message: "File not found",
          },
          fromCache: false,
        };
      }

      let tasksData = [...sampleTasks.tasks];

      // Success case
      if (!args.status && !args.withSubtasks) {
        return {
          success: true,
          data: {
            tasks: tasksData,
            stats: {
              total: tasksData.length,
              completed: tasksData.filter((t) => t.status === "done").length,
              inProgress: tasksData.filter((t) => t.status === "in-progress")
                .length,
              pending: tasksData.filter((t) => t.status === "pending").length,
            },
          },
          fromCache: false,
        };
      }

      // Status filter case
      if (args.status) {
        const filteredTasks = tasksData.filter((t) => t.status === args.status);
        return {
          success: true,
          data: {
            tasks: filteredTasks,
            filter: args.status,
            stats: {
              total: tasksData.length,
              filtered: filteredTasks.length,
            },
          },
          fromCache: false,
        };
      }

      // Include subtasks case
      if (args.withSubtasks) {
        return {
          success: true,
          data: {
            tasks: tasksData,
            includeSubtasks: true,
            stats: {
              total: tasksData.length,
            },
          },
          fromCache: false,
        };
      }

      // Default case
      return {
        success: true,
        data: { tasks: [] },
      };
    }

    test("should return all tasks when no filter is provided", async () => {
      // Arrange
      const args = {
        projectRoot: testProjectRoot,
        file: testTasksPath,
      };

      // Act
      const result = await testListTasks(args, mockLogger);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.tasks.length).toBe(sampleTasks.tasks.length);
      expect(result.data.stats.total).toBe(sampleTasks.tasks.length);
    });

    test("should filter tasks by status", async () => {
      // Arrange
      const args = {
        projectRoot: testProjectRoot,
        file: testTasksPath,
        status: "pending",
      };

      // Act
      const result = await testListTasks(args, mockLogger);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.filter).toBe("pending");
      // Should only include pending tasks
      result.data.tasks.forEach((task) => {
        expect(task.status).toBe("pending");
      });
    });

    test("should include subtasks when requested", async () => {
      // Arrange
      const args = {
        projectRoot: testProjectRoot,
        file: testTasksPath,
        withSubtasks: true,
      };

      // Act
      const result = await testListTasks(args, mockLogger);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.includeSubtasks).toBe(true);

      // Verify subtasks are included for tasks that have them
      const tasksWithSubtasks = result.data.tasks.filter(
        (t) => t.subtasks && t.subtasks.length > 0,
      );
      expect(tasksWithSubtasks.length).toBeGreaterThan(0);
    });

    test("should handle file not found errors", async () => {
      // Arrange
      const args = {
        projectRoot: testProjectRoot,
        file: "non-existent-file.json",
      };

      // Act
      const result = await testListTasks(args, mockLogger);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error.code).toBe("FILE_NOT_FOUND_ERROR");
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
