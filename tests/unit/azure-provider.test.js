import { jest } from '@jest/globals';

// Mock the dependencies using unstable_mockModule for ES modules
const mockCreateAzure = jest.fn();
const mockGenerateText = jest.fn();
const mockGenerateObject = jest.fn();
const mockStreamText = jest.fn();
const mockLog = jest.fn();

jest.unstable_mockModule('@ai-sdk/azure', () => ({
	createAzure: mockCreateAzure
}));

jest.unstable_mockModule('ai', () => ({
	generateText: mockGenerateText,
	generateObject: mockGenerateObject,
	streamText: mockStreamText
}));

jest.unstable_mockModule('../../scripts/modules/utils.js', () => ({
	log: mockLog
}));

// Import after mocking
const { generateAzureText, generateAzureObject, streamAzureText } =
	await import('../../src/ai-providers/azure.js');
const { z } = await import('zod');

describe.skip('Azure Provider', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// Reset all mocks to ensure clean state
		mockCreateAzure.mockReset();
		mockGenerateText.mockReset();
		mockGenerateObject.mockReset();
		mockStreamText.mockReset();
		mockLog.mockReset();
	});

	describe('generateAzureText', () => {
		it('should generate text successfully', async () => {
			const mockClient = jest.fn().mockReturnValue('mock-model-instance');
			const mockResult = {
				text: 'Generated text response',
				usage: {
					promptTokens: 10,
					completionTokens: 20
				}
			};

			mockCreateAzure.mockReturnValue(mockClient);
			mockGenerateText.mockResolvedValue(mockResult);

			const params = {
				apiKey: 'test-api-key',
				modelId: 'gpt-4o',
				messages: [{ role: 'user', content: 'Hello' }],
				maxTokens: 100,
				temperature: 0.7,
				baseUrl:
					'https://test-resource.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-02-01'
			};

			const result = await generateAzureText(params);

			expect(mockCreateAzure).toHaveBeenCalledWith({
				apiKey: 'test-api-key',
				resourceName: 'test-resource',
				apiVersion: '2025-01-01-preview'
			});

			expect(mockClient).toHaveBeenCalledWith('gpt-4o');

			expect(mockGenerateText).toHaveBeenCalledWith({
				model: 'mock-model-instance',
				messages: params.messages,
				maxTokens: params.maxTokens,
				temperature: params.temperature
			});

			expect(result).toEqual({
				text: 'Generated text response',
				usage: {
					inputTokens: 10,
					outputTokens: 20
				}
			});
		});

		it('should throw error when API key is missing', async () => {
			const params = {
				modelId: 'gpt-4o',
				messages: [{ role: 'user', content: 'Hello' }],
				baseUrl: 'https://test-resource.openai.azure.com/'
			};

			await expect(generateAzureText(params)).rejects.toThrow(
				'Azure OpenAI API key is required.'
			);
		});

		it('should throw error when baseUrl is invalid', async () => {
			const params = {
				apiKey: 'test-api-key',
				modelId: 'gpt-4o',
				messages: [{ role: 'user', content: 'Hello' }],
				baseUrl: 'https://invalid-url.com/'
			};

			await expect(generateAzureText(params)).rejects.toThrow(
				'Azure OpenAI resource name could not be determined from baseUrl'
			);
		});

		it('should extract deployment name from URL', async () => {
			const mockClient = jest.fn().mockReturnValue('mock-model-instance');
			const mockResult = {
				text: 'Generated text response',
				usage: {
					promptTokens: 10,
					completionTokens: 20
				}
			};

			mockCreateAzure.mockReturnValue(mockClient);
			mockGenerateText.mockResolvedValue(mockResult);

			const params = {
				apiKey: 'test-api-key',
				modelId: 'gpt-4o',
				messages: [{ role: 'user', content: 'Hello' }],
				baseUrl:
					'https://test-resource.openai.azure.com/openai/deployments/custom-deployment/chat/completions'
			};

			await generateAzureText(params);

			expect(mockClient).toHaveBeenCalledWith('custom-deployment');
			expect(mockGenerateText).toHaveBeenCalledWith({
				model: 'mock-model-instance',
				messages: params.messages,
				maxTokens: undefined,
				temperature: undefined
			});
		});
	});

	describe('generateAzureObject', () => {
		it('should generate object successfully', async () => {
			const mockClient = jest.fn().mockReturnValue('mock-model-instance');
			const mockResult = {
				object: { test: 'data' },
				usage: {
					promptTokens: 15,
					completionTokens: 25
				}
			};

			mockCreateAzure.mockReturnValue(mockClient);
			mockGenerateObject.mockResolvedValue(mockResult);

			// Create a proper Zod schema
			const testSchema = z.object({
				test: z.string()
			});

			const params = {
				apiKey: 'test-api-key',
				modelId: 'gpt-4o',
				messages: [{ role: 'user', content: 'Generate object' }],
				schema: testSchema,
				objectName: 'TestObject',
				baseUrl: 'https://test-resource.openai.azure.com/'
			};

			const result = await generateAzureObject(params);

			expect(mockClient).toHaveBeenCalledWith('gpt-4o');

			// Verify the call was made with the expected parameters
			const generateObjectCall = mockGenerateObject.mock.calls[0][0];
			expect(generateObjectCall.model).toBe('mock-model-instance');
			expect(generateObjectCall.mode).toBe('tool');
			expect(generateObjectCall.maxTokens).toBeUndefined();
			expect(generateObjectCall.temperature).toBeUndefined();

			// Check that the messages include our Azure compatibility system message
			expect(generateObjectCall.messages).toHaveLength(2);
			expect(generateObjectCall.messages[0].role).toBe('system');
			expect(generateObjectCall.messages[0].content).toContain(
				'IMPORTANT: You must include ALL fields'
			);
			expect(generateObjectCall.messages[1]).toEqual(params.messages[0]);

			// Check that the schema was transformed (it should be a ZodObject)
			expect(generateObjectCall.schema).toBeDefined();
			expect(generateObjectCall.schema._def.typeName).toBe('ZodObject');

			expect(result).toEqual({
				object: { test: 'data' },
				usage: {
					inputTokens: 15,
					outputTokens: 25
				}
			});
		});

		it('should throw error when schema is missing', async () => {
			const params = {
				apiKey: 'test-api-key',
				modelId: 'gpt-4o',
				messages: [{ role: 'user', content: 'Generate object' }],
				objectName: 'TestObject',
				baseUrl: 'https://test-resource.openai.azure.com/'
			};

			await expect(generateAzureObject(params)).rejects.toThrow(
				'Schema is required for Azure OpenAI object generation.'
			);
		});
	});

	describe('streamAzureText', () => {
		it('should initiate streaming successfully', async () => {
			const mockClient = jest.fn().mockReturnValue('mock-model-instance');
			const mockStreamResult = 'mock-stream-result';

			mockCreateAzure.mockReturnValue(mockClient);
			mockStreamText.mockResolvedValue(mockStreamResult);

			const params = {
				apiKey: 'test-api-key',
				modelId: 'gpt-4o',
				messages: [{ role: 'user', content: 'Hello' }],
				maxTokens: 100,
				temperature: 0.7,
				baseUrl: 'https://test-resource.openai.azure.com/'
			};

			const result = await streamAzureText(params);

			expect(mockClient).toHaveBeenCalledWith('gpt-4o');
			expect(mockStreamText).toHaveBeenCalledWith({
				model: 'mock-model-instance',
				messages: params.messages,
				maxTokens: params.maxTokens,
				temperature: params.temperature
			});

			expect(result).toBe(mockStreamResult);
		});

		it('should throw error when messages array is empty', async () => {
			const params = {
				apiKey: 'test-api-key',
				modelId: 'gpt-4o',
				messages: [],
				baseUrl: 'https://test-resource.openai.azure.com/'
			};

			await expect(streamAzureText(params)).rejects.toThrow(
				'Invalid or empty messages array provided for Azure OpenAI streaming.'
			);
		});
	});
});
