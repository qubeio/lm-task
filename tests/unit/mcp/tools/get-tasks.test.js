/**
 * @jest-environment node
 */
import { jest } from '@jest/globals';

describe('MCP Tool: get-tasks', () => {
  let server;
  let registerListTasksTool;

  // Mock tool utils to bypass normalization complexity but keep structure
  jest.unstable_mockModule('../../../../mcp-server/src/tools/utils.js', () => ({
    withNormalizedProjectRoot: (fn) => fn,
    handleApiResult: jest.fn((r) => r),
    createErrorResponse: jest.fn((m) => ({ success: false, error: { code: 'ERROR', message: m } }))
  }));

  // Mock direct core call
  const mockListTasksDirect = jest.fn();
  jest.unstable_mockModule('../../../../mcp-server/src/core/task-master-core.js', () => ({
    listTasksDirect: (...args) => mockListTasksDirect(...args)
  }));

  // Mock path utils for findTasksJsonPath
  const mockFindTasksJsonPath = jest.fn(() => '/mock/root/tasks/tasks.json');
  jest.unstable_mockModule('../../../../mcp-server/src/core/utils/path-utils.js', () => ({
    findTasksJsonPath: (...args) => mockFindTasksJsonPath(...args)
  }));

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    const toolModule = await import('../../../../mcp-server/src/tools/get-tasks.js');
    registerListTasksTool = toolModule.registerListTasksTool;

    server = { addTool: jest.fn() };
  });

  it('registers tool with expected shape', () => {
    registerListTasksTool(server);
    expect(server.addTool).toHaveBeenCalledTimes(1);
    const config = server.addTool.mock.calls[0][0];
    expect(config.name).toBe('get_tasks');
    expect(typeof config.execute).toBe('function');
  });

  it('executes happy path and delegates to listTasksDirect', async () => {
    registerListTasksTool(server);
    const config = server.addTool.mock.calls[0][0];
    const execute = config.execute;

    const mockLogger = { info: jest.fn(), error: jest.fn() };
    mockListTasksDirect.mockResolvedValue({ success: true, data: { tasks: [{ id: 1 }] } });

    const result = await execute({ status: 'pending', withSubtasks: true, projectRoot: '/mock/root' }, { log: mockLogger, session: {} });

    expect(mockFindTasksJsonPath).toHaveBeenCalled();
    expect(mockListTasksDirect).toHaveBeenCalledWith({ tasksJsonPath: '/mock/root/tasks/tasks.json', status: 'pending', withSubtasks: true }, mockLogger);
    expect(result.success).toBe(true);
    expect(result.data.tasks).toHaveLength(1);
  });

  it('returns error response when findTasksJsonPath throws', async () => {
    registerListTasksTool(server);
    const config = server.addTool.mock.calls[0][0];
    const execute = config.execute;

    const mockLogger = { info: jest.fn(), error: jest.fn() };
    mockFindTasksJsonPath.mockImplementationOnce(() => { throw new Error('not found'); });

    const result = await execute({ projectRoot: '/bad' }, { log: mockLogger, session: {} });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});


