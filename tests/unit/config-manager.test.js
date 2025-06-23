import fs from 'fs';
import path from 'path';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';

// --- Read REAL supported-models.json data BEFORE mocks ---
const __filename = fileURLToPath(import.meta.url); // Get current file path
const __dirname = path.dirname(__filename); // Get current directory
const realSupportedModelsPath = path.resolve(
	__dirname,
	'../../scripts/modules/supported-models.json'
);
let REAL_SUPPORTED_MODELS_CONTENT;
let REAL_SUPPORTED_MODELS_DATA;
try {
	REAL_SUPPORTED_MODELS_CONTENT = fs.readFileSync(
		realSupportedModelsPath,
		'utf-8'
	);
	REAL_SUPPORTED_MODELS_DATA = JSON.parse(REAL_SUPPORTED_MODELS_CONTENT);
} catch (err) {
	console.error(
		'FATAL TEST SETUP ERROR: Could not read or parse real supported-models.json',
		err
	);
	REAL_SUPPORTED_MODELS_CONTENT = '{}'; // Default to empty object on error
	REAL_SUPPORTED_MODELS_DATA = {};
	process.exit(1); // Exit if essential test data can't be loaded
}

// --- Define Mock Function Instances ---
const mockFindProjectRoot = jest.fn();
const mockLog = jest.fn();

// --- Mock Dependencies BEFORE importing the module under test ---

// Mock the entire 'fs' module
jest.mock('fs');

// Mock the 'utils.js' module using a factory function
jest.mock('../../scripts/modules/utils.js', () => ({
	__esModule: true, // Indicate it's an ES module mock
	findProjectRoot: mockFindProjectRoot, // Use the mock function instance
	log: mockLog, // Use the mock function instance
	// Include other necessary exports from utils if config-manager uses them directly
	resolveEnvVariable: jest.fn() // Example if needed
}));

// DO NOT MOCK 'chalk'

// --- Import the module under test AFTER mocks are defined ---
import * as configManager from '../../scripts/modules/config-manager.js';
// Import the mocked 'fs' module to allow spying on its functions
import fsMocked from 'fs';

// --- Test Data (Updated for Azure-only) ---
const MOCK_PROJECT_ROOT = '/mock/project';
const MOCK_CONFIG_PATH = path.join(MOCK_PROJECT_ROOT, '.lmtaskerconfig');

// Updated DEFAULT_CONFIG reflecting the Azure-only implementation
const DEFAULT_CONFIG = {
	models: {
		main: {
			provider: 'azure',
			modelId: 'gpt-4o',
			maxTokens: 16384,
			temperature: 0.2
		},
		fallback: {
			provider: 'azure',
			modelId: 'gpt-4o-mini',
			maxTokens: 16384,
			temperature: 0.2
		}
	},
	global: {
		logLevel: 'info',
		debug: false,
		defaultSubtasks: 5,
		defaultPriority: 'medium',
		projectName: 'LM-Tasker',
		azureOpenaiBaseUrl: 'https://your-endpoint.openai.azure.com'
	}
};

// Other test data (updated for Azure-only)
const VALID_CUSTOM_CONFIG = {
	models: {
		main: {
			provider: 'azure',
			modelId: 'gpt-4o',
			maxTokens: 4096,
			temperature: 0.5
		},
		fallback: {
			provider: 'azure',
			modelId: 'gpt-4o-mini',
			maxTokens: 100000,
			temperature: 0.4
		}
	},
	global: {
		logLevel: 'debug',
		defaultPriority: 'high',
		projectName: 'My Custom Project'
	}
};

const PARTIAL_CONFIG = {
	models: {
		main: { provider: 'azure', modelId: 'gpt-4o' }
	},
	global: {
		projectName: 'Partial Project'
	}
};

const INVALID_PROVIDER_CONFIG = {
	models: {
		main: { provider: 'invalid-provider', modelId: 'some-model' }
	},
	global: {
		logLevel: 'warn'
	}
};

// Define spies globally to be restored in afterAll
let consoleErrorSpy;
let consoleWarnSpy;
let fsReadFileSyncSpy;
let fsWriteFileSyncSpy;
let fsExistsSyncSpy;

beforeAll(() => {
	// Set up console spies
	consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
	// Restore all spies
	jest.restoreAllMocks();
});

// Reset mocks before each test for isolation
beforeEach(() => {
	// Clear all mock calls and reset implementations between tests
	jest.clearAllMocks();
	// Reset the external mock instances for utils
	mockFindProjectRoot.mockReset();
	mockLog.mockReset();

	// --- Set up spies ON the imported 'fs' mock ---
	fsExistsSyncSpy = jest.spyOn(fsMocked, 'existsSync');
	fsReadFileSyncSpy = jest.spyOn(fsMocked, 'readFileSync');
	fsWriteFileSyncSpy = jest.spyOn(fsMocked, 'writeFileSync');

	// --- Default Mock Implementations ---
	mockFindProjectRoot.mockReturnValue(MOCK_PROJECT_ROOT); // Default for utils.findProjectRoot
	fsExistsSyncSpy.mockReturnValue(true); // Assume files exist by default

	// Default readFileSync: Return REAL models content, mocked config, or throw error
	fsReadFileSyncSpy.mockImplementation((filePath) => {
		const baseName = path.basename(filePath);
		if (baseName === 'supported-models.json') {
			// Return the REAL file content stringified
			return REAL_SUPPORTED_MODELS_CONTENT;
		} else if (filePath === MOCK_CONFIG_PATH) {
			// Still mock the .lmtaskerconfig reads
			return JSON.stringify(DEFAULT_CONFIG); // Default behavior
		}
		// Throw for unexpected reads - helps catch errors
		throw new Error(`Unexpected fs.readFileSync call in test: ${filePath}`);
	});

	// Default writeFileSync: Do nothing, just allow calls
	fsWriteFileSyncSpy.mockImplementation(() => {});
});

// --- Validation Functions ---
describe('Validation Functions', () => {
	// Tests for validateProvider and validateProviderModelCombination
	test('validateProvider should return true for valid providers', () => {
		expect(configManager.validateProvider('azure')).toBe(true);
	});

	test('validateProvider should return false for invalid providers', () => {
		expect(configManager.validateProvider('invalid-provider')).toBe(false);
		expect(configManager.validateProvider('')).toBe(false);
		expect(configManager.validateProvider(null)).toBe(false);
	});

	test('validateProviderModelCombination should validate known good combinations', () => {
		// Re-load config to ensure MODEL_MAP is populated from mock (now real data)
		configManager.getConfig(MOCK_PROJECT_ROOT, true);
		expect(
			configManager.validateProviderModelCombination('azure', 'gpt-4o')
		).toBe(true);
		expect(
			configManager.validateProviderModelCombination('azure', 'gpt-4o-mini')
		).toBe(true);
	});

	test('validateProviderModelCombination should return false for known bad combinations', () => {
		// Re-load config to ensure MODEL_MAP is populated from mock (now real data)
		configManager.getConfig(MOCK_PROJECT_ROOT, true);
		expect(
			configManager.validateProviderModelCombination(
				'azure',
				'claude-3-opus-20240229'
			)
		).toBe(false);
	});

	test('validateProviderModelCombination should return true for providers not in map', () => {
		// Re-load config to ensure MODEL_MAP is populated from mock (now real data)
		configManager.getConfig(MOCK_PROJECT_ROOT, true);
		expect(
			configManager.validateProviderModelCombination('openai', 'any-model')
		).toBe(true);
		expect(
			configManager.validateProviderModelCombination('anthropic', 'any-model')
		).toBe(true);
	});

	test('validateProviderModelCombination should return true for providers not in map', () => {
		// Re-load config to ensure MODEL_MAP is populated from mock (now real data)
		configManager.getConfig(MOCK_PROJECT_ROOT, true);
		// The implementation returns true if the provider isn't in the map
		expect(
			configManager.validateProviderModelCombination(
				'unknown-provider',
				'some-model'
			)
		).toBe(true);
	});
});

// --- getConfig Tests ---
describe('getConfig Tests', () => {
	test('should return default config if .lmtaskerconfig does not exist', () => {
		// Arrange
		fsExistsSyncSpy.mockReturnValue(false);
		// findProjectRoot mock is set in beforeEach

		// Act: Call getConfig with explicit root
		const config = configManager.getConfig(MOCK_PROJECT_ROOT, true); // Force reload

		// Assert
		expect(config).toEqual(DEFAULT_CONFIG);
		expect(mockFindProjectRoot).not.toHaveBeenCalled(); // Explicit root provided
		expect(fsExistsSyncSpy).toHaveBeenCalledWith(MOCK_CONFIG_PATH);
		expect(fsReadFileSyncSpy).not.toHaveBeenCalled(); // No read if file doesn't exist
		expect(consoleWarnSpy).toHaveBeenCalledWith(
			expect.stringContaining('not found at provided project root')
		);
	});

	test.skip('should use findProjectRoot and return defaults if file not found', () => {
		// TODO: Fix mock interaction, findProjectRoot isn't being registered as called
		// Arrange
		fsExistsSyncSpy.mockReturnValue(false);
		// findProjectRoot mock is set in beforeEach

		// Act: Call getConfig without explicit root
		const config = configManager.getConfig(null, true); // Force reload

		// Assert
		expect(mockFindProjectRoot).toHaveBeenCalled(); // Should be called now
		expect(fsExistsSyncSpy).toHaveBeenCalledWith(MOCK_CONFIG_PATH);
		expect(config).toEqual(DEFAULT_CONFIG);
		expect(fsReadFileSyncSpy).not.toHaveBeenCalled();
		expect(consoleWarnSpy).toHaveBeenCalledWith(
			expect.stringContaining('not found at derived root')
		); // Adjusted expected warning
	});

	test('should read and merge valid config file with defaults', () => {
		// Arrange: Override readFileSync for this test
		fsReadFileSyncSpy.mockImplementation((filePath) => {
			if (filePath === MOCK_CONFIG_PATH)
				return JSON.stringify(VALID_CUSTOM_CONFIG);
			if (path.basename(filePath) === 'supported-models.json') {
				// Provide necessary models for validation within getConfig
				return JSON.stringify({
					azure: [{ id: 'gpt-4o' }, { id: 'gpt-4o-mini' }, { id: 'o3-mini' }]
				});
			}
			throw new Error(`Unexpected fs.readFileSync call: ${filePath}`);
		});
		fsExistsSyncSpy.mockReturnValue(true);
		// findProjectRoot mock set in beforeEach

		// Act
		const config = configManager.getConfig(MOCK_PROJECT_ROOT, true); // Force reload

		// Assert: Construct expected merged config
		const expectedMergedConfig = {
			models: {
				main: {
					...DEFAULT_CONFIG.models.main,
					...VALID_CUSTOM_CONFIG.models.main
				},
				fallback: {
					...DEFAULT_CONFIG.models.fallback,
					...VALID_CUSTOM_CONFIG.models.fallback
				}
			},
			global: { ...DEFAULT_CONFIG.global, ...VALID_CUSTOM_CONFIG.global }
		};
		expect(config).toEqual(expectedMergedConfig);
		expect(fsExistsSyncSpy).toHaveBeenCalledWith(MOCK_CONFIG_PATH);
		expect(fsReadFileSyncSpy).toHaveBeenCalledWith(MOCK_CONFIG_PATH, 'utf-8');
	});

	test('should merge defaults for partial config file', () => {
		// Arrange
		fsReadFileSyncSpy.mockImplementation((filePath) => {
			if (filePath === MOCK_CONFIG_PATH) return JSON.stringify(PARTIAL_CONFIG);
			if (path.basename(filePath) === 'supported-models.json') {
				return JSON.stringify({
					azure: [{ id: 'gpt-4o' }, { id: 'gpt-4o-mini' }]
				});
			}
			throw new Error(`Unexpected fs.readFileSync call: ${filePath}`);
		});
		fsExistsSyncSpy.mockReturnValue(true);
		// findProjectRoot mock set in beforeEach

		// Act
		const config = configManager.getConfig(MOCK_PROJECT_ROOT, true);

		// Assert: Construct expected merged config
		const expectedMergedConfig = {
			models: {
				main: { ...DEFAULT_CONFIG.models.main, ...PARTIAL_CONFIG.models.main },
				fallback: { ...DEFAULT_CONFIG.models.fallback }
			},
			global: { ...DEFAULT_CONFIG.global, ...PARTIAL_CONFIG.global }
		};
		expect(config).toEqual(expectedMergedConfig);
		expect(fsReadFileSyncSpy).toHaveBeenCalledWith(MOCK_CONFIG_PATH, 'utf-8');
	});

	test('should handle JSON parsing error and return defaults', () => {
		// Arrange
		fsReadFileSyncSpy.mockImplementation((filePath) => {
			if (filePath === MOCK_CONFIG_PATH) return 'invalid json';
			// Mock models read needed for initial load before parse error
			if (path.basename(filePath) === 'supported-models.json') {
				return JSON.stringify({
					azure: [{ id: 'gpt-4o' }, { id: 'gpt-4o-mini' }]
				});
			}
			throw new Error(`Unexpected fs.readFileSync call: ${filePath}`);
		});
		fsExistsSyncSpy.mockReturnValue(true);
		// findProjectRoot mock set in beforeEach

		// Act
		const config = configManager.getConfig(MOCK_PROJECT_ROOT, true);

		// Assert
		expect(config).toEqual(DEFAULT_CONFIG);
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining('Error reading or parsing')
		);
	});

	test('should handle file read error and return defaults', () => {
		// Arrange
		fsReadFileSyncSpy.mockImplementation((filePath) => {
			if (filePath === MOCK_CONFIG_PATH) {
				const error = new Error('Permission denied');
				error.code = 'EACCES';
				throw error;
			}
			if (path.basename(filePath) === 'supported-models.json') {
				return JSON.stringify({
					azure: [{ id: 'gpt-4o' }, { id: 'gpt-4o-mini' }]
				});
			}
			throw new Error(`Unexpected fs.readFileSync call: ${filePath}`);
		});
		fsExistsSyncSpy.mockReturnValue(true);
		// findProjectRoot mock set in beforeEach

		// Act
		const config = configManager.getConfig(MOCK_PROJECT_ROOT, true);

		// Assert
		expect(config).toEqual(DEFAULT_CONFIG);
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining(`Permission denied. Using default configuration.`)
		);
	});

	test('should validate provider and fallback to default if invalid', () => {
		// Arrange
		fsReadFileSyncSpy.mockImplementation((filePath) => {
			if (filePath === MOCK_CONFIG_PATH)
				return JSON.stringify(INVALID_PROVIDER_CONFIG);
			if (path.basename(filePath) === 'supported-models.json') {
				return JSON.stringify({
					azure: [{ id: 'gpt-4o' }, { id: 'gpt-4o-mini' }]
				});
			}
			throw new Error(`Unexpected fs.readFileSync call: ${filePath}`);
		});
		fsExistsSyncSpy.mockReturnValue(true);
		// findProjectRoot mock set in beforeEach

		// Act
		const config = configManager.getConfig(MOCK_PROJECT_ROOT, true);

		// Assert: Should use defaults for invalid provider but keep valid global settings
		const expectedMergedConfig = {
			models: {
				main: { ...DEFAULT_CONFIG.models.main },
				fallback: { ...DEFAULT_CONFIG.models.fallback }
			},
			global: { ...DEFAULT_CONFIG.global, ...INVALID_PROVIDER_CONFIG.global }
		};
		expect(config).toEqual(expectedMergedConfig);
	});
});

// --- writeConfig ---
describe('writeConfig', () => {
	test('should write valid config to file', () => {
		// Arrange
		const testConfig = { ...DEFAULT_CONFIG };
		fsWriteFileSyncSpy.mockImplementation(() => {}); // Success

		// Act
		const result = configManager.writeConfig(testConfig, MOCK_PROJECT_ROOT);

		// Assert
		expect(result).toBe(true);
		expect(fsWriteFileSyncSpy).toHaveBeenCalledWith(
			MOCK_CONFIG_PATH,
			JSON.stringify(testConfig, null, 2)
		);
	});

	test('should return false and log error if write fails', () => {
		// Arrange
		const testConfig = { ...DEFAULT_CONFIG };
		const writeError = new Error('Write failed');
		fsWriteFileSyncSpy.mockImplementation(() => {
			throw writeError;
		});

		// Act
		const result = configManager.writeConfig(testConfig, MOCK_PROJECT_ROOT);

		// Assert
		expect(result).toBe(false);
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining('Error writing configuration to')
		);
	});

	test.skip('should return false if project root cannot be determined', () => {
		// TODO: Implement this test when the function behavior is clarified
	});
});

// --- Getter Functions ---
describe('Getter Functions', () => {
	test('getMainProvider should return provider from config', () => {
		// Arrange: Set up a config
		fsReadFileSyncSpy.mockImplementation((filePath) => {
			if (filePath === MOCK_CONFIG_PATH) return JSON.stringify(DEFAULT_CONFIG);
			if (path.basename(filePath) === 'supported-models.json') {
				return REAL_SUPPORTED_MODELS_CONTENT;
			}
			throw new Error(`Unexpected fs.readFileSync call: ${filePath}`);
		});

		// Act
		const provider = configManager.getMainProvider(MOCK_PROJECT_ROOT);

		// Assert
		expect(provider).toBe('azure');
	});

	test('getLogLevel should return logLevel from config', () => {
		// Arrange: Set up a config
		fsReadFileSyncSpy.mockImplementation((filePath) => {
			if (filePath === MOCK_CONFIG_PATH) return JSON.stringify(DEFAULT_CONFIG);
			if (path.basename(filePath) === 'supported-models.json') {
				return REAL_SUPPORTED_MODELS_CONTENT;
			}
			throw new Error(`Unexpected fs.readFileSync call: ${filePath}`);
		});

		// Act
		const logLevel = configManager.getLogLevel(MOCK_PROJECT_ROOT);

		// Assert
		expect(logLevel).toBe('info');
	});
});

// --- isConfigFilePresent ---
describe('isConfigFilePresent', () => {
	test('should return true if config file exists', () => {
		// Arrange
		fsExistsSyncSpy.mockReturnValue(true);

		// Act
		const result = configManager.isConfigFilePresent(MOCK_PROJECT_ROOT);

		// Assert
		expect(result).toBe(true);
		expect(fsExistsSyncSpy).toHaveBeenCalledWith(MOCK_CONFIG_PATH);
	});

	test('should return false if config file does not exist', () => {
		// Arrange
		fsExistsSyncSpy.mockReturnValue(false);

		// Act
		const result = configManager.isConfigFilePresent(MOCK_PROJECT_ROOT);

		// Assert
		expect(result).toBe(false);
		expect(fsExistsSyncSpy).toHaveBeenCalledWith(MOCK_CONFIG_PATH);
	});

	test.skip('should use findProjectRoot if explicitRoot is not provided', () => {
		// TODO: Implement this test when the function behavior is clarified
	});
});

// --- getAllProviders ---
describe('getAllProviders', () => {
	test('should return list of providers from supported-models.json', () => {
		// Act
		const providers = configManager.getAllProviders();

		// Assert
		expect(providers).toEqual(['azure']);
		expect(providers).toContain('azure');
	});
});
