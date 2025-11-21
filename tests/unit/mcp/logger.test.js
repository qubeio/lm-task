/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";
import logger, { log as rawLog } from "../../../mcp-server/src/logger.js";
import {
  enableSilentMode,
  disableSilentMode,
} from "#scripts/utils.js";

describe("MCP logger stdout safety", () => {
  let originalLog;
  let originalError;

  beforeEach(() => {
    originalLog = console.log;
    originalError = console.error;
    console.log = jest.fn();
    console.error = jest.fn();
    disableSilentMode();
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
    disableSilentMode();
    jest.restoreAllMocks();
  });

  test("routes info logs to stderr only", () => {
    logger.info("Codex compatibility check");

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.log).not.toHaveBeenCalled();
  });

  test("suppresses output when silent mode is enabled", () => {
    enableSilentMode();

    logger.info("This should be muted");

    expect(console.error).not.toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled();
  });

  test("ignores unknown log levels without emitting noise", () => {
    rawLog("unknown-level", "Ignored message");

    expect(console.error).not.toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled();
  });
});
