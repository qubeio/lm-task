/**
 * CLI Adapter
 * Interface for calling existing LM-Tasker CLI commands from the TUI
 */

import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { findProjectRoot } from "../../../utils.js";

const execAsync = promisify(exec);

export class CliAdapter {
  constructor(options = {}) {
    this.projectRoot =
      options.projectRoot || findProjectRoot() || process.cwd();
    this.tasksFile =
      options.tasksFile || path.join(this.projectRoot, "tasks", "tasks.json");
    this.cliPath = this.findCliPath();
  }

  /**
   * Find the path to the task-master CLI
   */
  findCliPath() {
    // Use the main task-master command instead of dev.js directly
    // This works because task-master is available in the PATH when running from this project
    return "task-master";
  }

  /**
   * Execute a CLI command and return parsed JSON result
   */
  async executeCommand(command, args = []) {
    try {
      const argsString = args.join(" ");
      const fullCommand = `${this.cliPath} ${command} ${argsString}`;

      const { stdout, stderr } = await execAsync(fullCommand, {
        cwd: this.projectRoot,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer for large task lists
      });

      if (stderr && !stderr.includes("Warning:") && !stderr.includes("DEBUG")) {
        throw new Error(`CLI Error: ${stderr}`);
      }

      // Try to parse as JSON first, fall back to text
      try {
        return JSON.parse(stdout);
      } catch (parseError) {
        // If not JSON, return as text (for commands that don't support --json yet)
        return { text: stdout.trim() };
      }
    } catch (error) {
      throw new Error(
        `Failed to execute command '${command}': ${error.message}`,
      );
    }
  }

  /**
   * Get all tasks
   */
  async getTasks(options = {}) {
    // console.log("DEBUG: CliAdapter.getTasks called with options:", options);
    // console.log("DEBUG: Project root:", this.projectRoot);
    // console.log("DEBUG: Tasks file:", this.tasksFile);
    // console.log("DEBUG: CLI path:", this.cliPath);

    const args = ["--json"];

    if (this.tasksFile) {
      args.push(`--file=${this.tasksFile}`);
    }

    if (options.status) {
      args.push(`--status=${options.status}`);
    }

    if (options.withSubtasks) {
      args.push("--with-subtasks");
    }

    // console.log("DEBUG: Command args:", args);

    try {
      // console.log("DEBUG: Executing command 'list' with args:", args);
      const result = await this.executeCommand("list", args);
      // console.log("DEBUG: Command result:", result);

      // Check if executeCommand returned parsed JSON directly (successful --json case)
      if (
        result &&
        typeof result === "object" &&
        !result.text &&
        (result.tasks || result.stats)
      ) {
        // console.log("DEBUG: Got parsed JSON directly from executeCommand");
        return {
          tasks: result.tasks || [],
          stats: result.stats || {
            total: 0,
            completed: 0,
            inProgress: 0,
            pending: 0,
          },
        };
      }
      // Handle case where executeCommand returned {text: "..."} (fallback case)
      else if (result.text) {
        try {
          return this.parseTaskListJson(result.text);
        } catch (jsonError) {
          // console.log(
          //   "DEBUG: JSON parsing failed, trying text parsing:",
          //   jsonError.message
          // );
          // If JSON parsing fails, try text parsing
          return this.parseTaskListText(result.text);
        }
      } else {
        // console.log("DEBUG: No valid result, returning empty tasks");
        return {
          tasks: [],
          stats: { total: 0, completed: 0, inProgress: 0, pending: 0 },
        };
      }
    } catch (error) {
      // console.log("DEBUG: Command failed, trying fallback:", error.message);
      // Fallback: try without --json flag
      try {
        const args = [];
        if (this.tasksFile) {
          args.push(`--file=${this.tasksFile}`);
        }
        if (options.status) {
          args.push(`--status=${options.status}`);
        }
        if (options.withSubtasks) {
          args.push("--with-subtasks");
        }

        const result = await this.executeCommand("list", args);
        return this.parseTaskListText(result.text || "");
      } catch (fallbackError) {
        throw new Error(`Failed to get tasks: ${error.message}`);
      }
    }
  }

  /**
   * Get a specific task by ID
   */
  async getTask(id) {
    const args = ["--json"];

    if (this.tasksFile) {
      args.push(`--file=${this.tasksFile}`);
    }

    try {
      const result = await this.executeCommand("show", [id, ...args]);

      if (result.task || result.data) {
        const taskData = result.task || result.data;
        return taskData;
      } else if (result.text) {
        return this.parseTaskDetailText(result.text);
      } else {
        throw new Error("Task not found");
      }
    } catch (error) {
      // Fallback: try without --json flag
      try {
        const args = [id];
        if (this.tasksFile) {
          args.push(`--file=${this.tasksFile}`);
        }

        const result = await this.executeCommand("show", args);
        return this.parseTaskDetailText(result.text || "");
      } catch (fallbackError) {
        throw new Error(`Failed to get task ${id}: ${error.message}`);
      }
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(id, status) {
    const args = [`--id=${id}`, `--status=${status}`];

    if (this.tasksFile) {
      args.push(`--file=${this.tasksFile}`);
    }

    try {
      const result = await this.executeCommand("set-status", args);
      return result;
    } catch (error) {
      throw new Error(`Failed to update task ${id} status: ${error.message}`);
    }
  }

  /**
   * Parse JSON output from task list command
   */
  parseTaskListJson(jsonText) {
    try {
      // Clean the JSON by finding the end of the JSON object
      // This handles cases where there's extra output after the JSON (like update notifications)
      let cleanJson = jsonText.trim();

      // Find the last closing brace that would end the JSON object
      let braceCount = 0;
      let lastValidIndex = -1;

      for (let i = 0; i < cleanJson.length; i++) {
        if (cleanJson[i] === "{") {
          braceCount++;
        } else if (cleanJson[i] === "}") {
          braceCount--;
          if (braceCount === 0) {
            lastValidIndex = i;
            break;
          }
        }
      }

      if (lastValidIndex > -1) {
        cleanJson = cleanJson.substring(0, lastValidIndex + 1);
      }

      const data = JSON.parse(cleanJson);

      return {
        tasks: data.tasks || [],
        stats: data.stats || {
          total: 0,
          completed: 0,
          inProgress: 0,
          pending: 0,
        },
      };
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error.message}`);
    }
  }

  /**
   * Parse text output from task list command
   * This is a fallback for when --json is not available
   */
  parseTaskListText(text) {
    const tasks = [];
    const lines = text.split("\n");

    let inTaskSection = false;
    let taskCount = 0;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and headers
      if (!trimmed || trimmed.startsWith("─") || trimmed.startsWith("│ ID")) {
        continue;
      }

      // Check if this looks like a task line
      const taskMatch = trimmed.match(
        /^│?\s*(\d+(?:\.\d+)?)\s*│\s*([^│]+)\s*│\s*([^│]+)\s*│\s*(.+?)\s*│?$/,
      );

      if (taskMatch) {
        const [, id, status, priority, title] = taskMatch;

        tasks.push({
          id: parseInt(id.split(".")[0], 10), // Handle subtask IDs
          title: title.trim(),
          status: this.parseStatusText(status.trim()),
          priority: priority.trim().toLowerCase(),
          description: "",
          details: "",
          dependencies: [],
          subtasks: [],
        });

        taskCount++;
      }
    }

    return {
      tasks,
      stats: {
        total: taskCount,
        completed: tasks.filter((t) => t.status === "done").length,
        inProgress: tasks.filter((t) => t.status === "in-progress").length,
        pending: tasks.filter((t) => t.status === "pending").length,
      },
    };
  }

  /**
   * Parse text output from task detail command
   */
  parseTaskDetailText(text) {
    const lines = text.split("\n");
    let task = {
      id: null,
      title: "",
      status: "pending",
      priority: "medium",
      description: "",
      details: "",
      testStrategy: "",
      dependencies: [],
      subtasks: [],
    };

    let currentSection = "";
    let content = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Parse task header
      if (trimmed.startsWith("Task #")) {
        const match = trimmed.match(/Task #(\d+):\s*(.+)/);
        if (match) {
          task.id = parseInt(match[1], 10);
          task.title = match[2];
        }
        continue;
      }

      // Parse status, priority, etc.
      if (trimmed.startsWith("Status:")) {
        task.status = this.parseStatusText(
          trimmed.replace("Status:", "").trim(),
        );
        continue;
      }

      if (trimmed.startsWith("Priority:")) {
        task.priority = trimmed.replace("Priority:", "").trim().toLowerCase();
        continue;
      }

      // Section headers
      if (trimmed === "Description:") {
        currentSection = "description";
        content = [];
        continue;
      }

      if (trimmed === "Details:") {
        currentSection = "details";
        content = [];
        continue;
      }

      if (trimmed === "Test Strategy:") {
        currentSection = "testStrategy";
        content = [];
        continue;
      }

      // Collect content for current section
      if (currentSection && trimmed) {
        content.push(trimmed);
      } else if (currentSection && content.length > 0) {
        // End of section
        task[currentSection] = content.join("\n");
        currentSection = "";
        content = [];
      }
    }

    // Handle last section
    if (currentSection && content.length > 0) {
      task[currentSection] = content.join("\n");
    }

    return task;
  }

  /**
   * Parse status text to standard format
   */
  parseStatusText(statusText) {
    const cleaned = statusText
      .replace(/[✅⏳🔄]/g, "")
      .trim()
      .toLowerCase();

    switch (cleaned) {
      case "done":
      case "completed":
        return "done";
      case "in-progress":
      case "in progress":
      case "working":
        return "in-progress";
      case "pending":
      case "todo":
      case "waiting":
        return "pending";
      case "blocked":
        return "blocked";
      case "cancelled":
      case "canceled":
        return "cancelled";
      default:
        return "pending";
    }
  }
}
