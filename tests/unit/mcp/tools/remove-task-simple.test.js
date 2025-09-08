/**
 * @jest-environment node
 */
import { jest } from '@jest/globals';

describe('MCP Tool: remove-task (Integration)', () => {
  let server;
  let registerRemoveTaskTool;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Import the tool registration function
    const toolModule = await import('../../../../mcp-server/src/tools/remove-task.js');
    registerRemoveTaskTool = toolModule.registerRemoveTaskTool;

    // Mock server
    server = {
      addTool: jest.fn()
    };
  });

  describe('Tool Registration', () => {
    it('should register the tool with correct name and parameters', () => {
      registerRemoveTaskTool(server);

      expect(server.addTool).toHaveBeenCalledTimes(1);
      const toolCall = server.addTool.mock.calls[0][0];
      
      expect(toolCall.name).toBe('remove_task');
      expect(toolCall.description).toContain('Remove a task or subtask permanently');
      expect(toolCall.execute).toBeDefined();
      expect(typeof toolCall.execute).toBe('function');
    });

    it('should have required parameters', () => {
      registerRemoveTaskTool(server);
      
      const toolCall = server.addTool.mock.calls[0][0];
      const params = toolCall.parameters.shape;
      
      expect(params.id).toBeDefined();
      expect(params.projectRoot).toBeDefined();
      expect(params.file).toBeDefined();
      expect(params.confirm).toBeDefined();
    });

    it('should have correct parameter types', () => {
      registerRemoveTaskTool(server);
      
      const toolCall = server.addTool.mock.calls[0][0];
      const params = toolCall.parameters.shape;
      
      // id should be required string
      expect(params.id._def.typeName).toBe('ZodString');
      
      // projectRoot should be required string  
      expect(params.projectRoot._def.typeName).toBe('ZodString');
      
      // file should be optional
      expect(params.file._def.typeName).toBe('ZodOptional');
      
      // confirm should be optional
      expect(params.confirm._def.typeName).toBe('ZodOptional');
    });
  });

  describe('Parameter Descriptions', () => {
    it('should have descriptive parameter descriptions', () => {
      registerRemoveTaskTool(server);
      
      const toolCall = server.addTool.mock.calls[0][0];
      const params = toolCall.parameters.shape;
      
      expect(params.id.description).toContain('ID of the task or subtask to remove');
      expect(params.id.description).toContain('comma-separated');
      
      expect(params.projectRoot.description).toContain('directory of the project');
      expect(params.projectRoot.description).toContain('absolute path');
      
      expect(params.file.description).toContain('path to the tasks file');
      
      expect(params.confirm.description).toContain('skip confirmation');
    });
  });

  describe('Tool Execution Structure', () => {
    it('should have execute function that can be called', async () => {
      registerRemoveTaskTool(server);
      
      const toolCall = server.addTool.mock.calls[0][0];
      const executeFunction = toolCall.execute;
      
      // Mock the context and args for a basic call
      const mockArgs = {
        id: '1',
        projectRoot: '/nonexistent/path' // This will fail, but we just want to verify the function structure
      };
      
      const mockContext = {
        log: {
          info: jest.fn(),
          error: jest.fn()
        }
      };

      // The function should be callable (even if it fails due to missing files)
      const result = await executeFunction(mockArgs, mockContext);
      
      // Should return an object with some structure
      expect(typeof result).toBe('object');
      expect(result).not.toBeNull();
      
      // Should have logged something
      expect(mockContext.log.info).toHaveBeenCalled();
    });
  });
});
