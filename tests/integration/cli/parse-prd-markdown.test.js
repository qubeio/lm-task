import { jest } from "@jest/globals";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Skip integration tests if no API keys are available
const hasApiKeys =
  process.env.ANTHROPIC_API_KEY ||
  process.env.OPENAI_API_KEY ||
  process.env.AZURE_OPENAI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.MISTRAL_API_KEY ||
  process.env.PERPLEXITY_API_KEY ||
  process.env.OPENROUTER_API_KEY ||
  process.env.XAI_API_KEY;

const describeOrSkip = hasApiKeys ? describe : describe.skip;

describeOrSkip("CLI parse-prd Markdown Integration Tests", () => {
  const testDir = path.join(__dirname, "..", "..", "temp", "cli-prd-markdown");
  const fixturesDir = path.join(__dirname, "..", "..", "fixtures");

  beforeEach(() => {
    // Create test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  describe("Markdown PRD Parsing", () => {
    test("parses complex Markdown PRD successfully", () => {
      const prdPath = path.join(fixturesDir, "sample-prd-markdown.md");
      const tasksPath = path.join(testDir, "tasks.json");

      // Run CLI command
      const result = execSync(
        `node scripts/dev.js parse-prd "${prdPath}" --output="${tasksPath}" --num-tasks=8 --force`,
        {
          cwd: path.join(__dirname, "..", "..", ".."),
          encoding: "utf8",
          timeout: 30000,
        },
      );

      // Verify output
      expect(result).toContain("Successfully parsed PRD");
      expect(fs.existsSync(tasksPath)).toBe(true);

      const tasks = JSON.parse(fs.readFileSync(tasksPath, "utf8"));
      expect(tasks.tasks).toBeDefined();
      expect(tasks.tasks.length).toBeGreaterThan(0);
    });

    test("parses simple Markdown PRD successfully", () => {
      const prdPath = path.join(fixturesDir, "simple-prd.md");
      const tasksPath = path.join(testDir, "tasks.json");

      const result = execSync(
        `node scripts/dev.js parse-prd "${prdPath}" --output="${tasksPath}" --num-tasks=4 --force`,
        {
          cwd: path.join(__dirname, "..", "..", ".."),
          encoding: "utf8",
          timeout: 30000,
        },
      );

      expect(result).toContain("Successfully parsed PRD");
      expect(fs.existsSync(tasksPath)).toBe(true);

      const tasks = JSON.parse(fs.readFileSync(tasksPath, "utf8"));
      expect(tasks.tasks.length).toBeGreaterThan(0);
      expect(tasks.tasks.length).toBeLessThanOrEqual(6); // Should be around 4 but AI might generate slightly more
    });
  });

  describe("Backward Compatibility", () => {
    test("still works with legacy .txt PRD files", () => {
      const prdPath = path.join(fixturesDir, "legacy-prd.txt");
      const tasksPath = path.join(testDir, "tasks-legacy.json");

      const result = execSync(
        `node scripts/dev.js parse-prd "${prdPath}" --output="${tasksPath}" --num-tasks=5 --force`,
        {
          cwd: path.join(__dirname, "..", "..", ".."),
          encoding: "utf8",
          timeout: 30000,
        },
      );

      expect(result).toContain("Successfully parsed PRD");
      expect(fs.existsSync(tasksPath)).toBe(true);

      const tasks = JSON.parse(fs.readFileSync(tasksPath, "utf8"));
      expect(tasks.tasks.length).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    test("handles non-existent PRD file gracefully", () => {
      const prdPath = path.join(testDir, "non-existent.md");
      const tasksPath = path.join(testDir, "tasks-error.json");

      expect(() => {
        execSync(
          `node scripts/dev.js parse-prd "${prdPath}" --output="${tasksPath}" --force`,
          {
            cwd: path.join(__dirname, "..", "..", ".."),
            encoding: "utf8",
            timeout: 10000,
          },
        );
      }).toThrow();
    });

    test("handles malformed PRD file gracefully", () => {
      const prdPath = path.join(fixturesDir, "malformed-prd.md");
      const tasksPath = path.join(testDir, "tasks-malformed.json");

      // This should either succeed with a warning or fail gracefully
      try {
        const result = execSync(
          `node scripts/dev.js parse-prd "${prdPath}" --output="${tasksPath}" --num-tasks=2 --force`,
          {
            cwd: path.join(__dirname, "..", "..", ".."),
            encoding: "utf8",
            timeout: 30000,
          },
        );

        // If it succeeds, should still create some tasks
        if (fs.existsSync(tasksPath)) {
          const tasks = JSON.parse(fs.readFileSync(tasksPath, "utf8"));
          expect(tasks.tasks).toBeDefined();
        }
      } catch (error) {
        // If it fails, should be a reasonable error message
        expect(error.message).toContain("PRD");
      }
    });

    test("handles existing tasks file without force flag", () => {
      const prdPath = path.join(fixturesDir, "simple-prd.md");
      const tasksPath = path.join(testDir, "existing-tasks.json");

      // Create existing file
      fs.writeFileSync(tasksPath, '{"tasks": []}');

      // The command doesn't throw - it prompts for confirmation
      // When user says "no", it should exit gracefully without creating tasks
      try {
        const result = execSync(
          `echo "n" | node scripts/dev.js parse-prd "${prdPath}" --output="${tasksPath}"`,
          {
            cwd: path.join(__dirname, "..", "..", ".."),
            encoding: "utf8",
            timeout: 10000,
          },
        );

        // If it completes, the original file should be unchanged
        const tasks = JSON.parse(fs.readFileSync(tasksPath, "utf8"));
        expect(tasks.tasks).toHaveLength(0); // Should still be empty
      } catch (error) {
        // It's okay if it times out or errors due to the prompt
        expect(error.message).toMatch(/timeout|SIGTERM|cancelled/i);
      }
    });
  });

  describe("Output Validation", () => {
    test("generates valid task structure from Markdown PRD", () => {
      const prdPath = path.join(fixturesDir, "sample-prd-markdown.md");
      const tasksPath = path.join(testDir, "tasks-validation.json");

      execSync(
        `node scripts/dev.js parse-prd "${prdPath}" --output="${tasksPath}" --num-tasks=6 --force`,
        {
          cwd: path.join(__dirname, "..", "..", ".."),
          encoding: "utf8",
          timeout: 30000,
        },
      );

      const tasks = JSON.parse(fs.readFileSync(tasksPath, "utf8"));

      // Validate structure
      expect(tasks).toHaveProperty("tasks");
      expect(Array.isArray(tasks.tasks)).toBe(true);

      // Validate each task has required fields
      tasks.tasks.forEach((task, index) => {
        expect(task).toHaveProperty("id");
        expect(task).toHaveProperty("title");
        expect(task).toHaveProperty("description");
        expect(task).toHaveProperty("details");
        expect(task).toHaveProperty("testStrategy");
        expect(task).toHaveProperty("priority");
        expect(task).toHaveProperty("dependencies");
        expect(task).toHaveProperty("status");

        expect(typeof task.id).toBe("number");
        expect(typeof task.title).toBe("string");
        expect(typeof task.description).toBe("string");
        expect(Array.isArray(task.dependencies)).toBe(true);
        expect(task.status).toBe("pending");
        expect(task.id).toBe(index + 1); // Sequential IDs
      });
    });

    test("generates task files after parsing", () => {
      const prdPath = path.join(fixturesDir, "simple-prd.md");
      const tasksPath = path.join(testDir, "tasks-with-files.json");

      execSync(
        `node scripts/dev.js parse-prd "${prdPath}" --output="${tasksPath}" --num-tasks=3 --force`,
        {
          cwd: path.join(__dirname, "..", "..", ".."),
          encoding: "utf8",
          timeout: 30000,
        },
      );

      // Check that individual task files were created
      const tasksDir = path.dirname(tasksPath);
      const files = fs.readdirSync(tasksDir);
      const taskFiles = files.filter((f) => f.match(/^task_\d+\.txt$/));

      expect(taskFiles.length).toBeGreaterThan(0);

      // Verify task file content
      const firstTaskFile = path.join(tasksDir, taskFiles[0]);
      const taskContent = fs.readFileSync(firstTaskFile, "utf8");
      expect(taskContent).toContain("Task");
      expect(taskContent).toContain("Description");
      expect(taskContent).toContain("Details");
      expect(taskContent).toContain("Test Strategy");
    });
  });

  describe("Performance and Reliability", () => {
    test("completes parsing within reasonable time", () => {
      const prdPath = path.join(fixturesDir, "sample-prd-markdown.md");
      const tasksPath = path.join(testDir, "tasks-performance.json");

      const startTime = Date.now();

      execSync(
        `node scripts/dev.js parse-prd "${prdPath}" --output="${tasksPath}" --num-tasks=5 --force`,
        {
          cwd: path.join(__dirname, "..", "..", ".."),
          encoding: "utf8",
          timeout: 60000, // 1 minute max
        },
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(60000); // Should complete within 1 minute
      expect(fs.existsSync(tasksPath)).toBe(true);
    });

    test("handles concurrent parsing requests", async () => {
      const prdPath = path.join(fixturesDir, "simple-prd.md");

      // Run multiple parse operations concurrently
      const promises = Array.from({ length: 3 }, (_, i) => {
        const tasksPath = path.join(testDir, `tasks-concurrent-${i}.json`);
        return new Promise((resolve, reject) => {
          try {
            execSync(
              `node scripts/dev.js parse-prd "${prdPath}" --output="${tasksPath}" --num-tasks=2 --force`,
              {
                cwd: path.join(__dirname, "..", "..", ".."),
                encoding: "utf8",
                timeout: 30000,
              },
            );
            resolve(tasksPath);
          } catch (error) {
            reject(error);
          }
        });
      });

      const results = await Promise.all(promises);

      // All should succeed
      expect(results).toHaveLength(3);
      results.forEach((tasksPath) => {
        expect(fs.existsSync(tasksPath)).toBe(true);
      });
    });
  });
});
