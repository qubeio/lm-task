import { jest } from "@jest/globals";

// Mock config-manager
const mockGetMainProvider = jest.fn();
const mockGetMainModelId = jest.fn();
// Research provider/model removed
const mockGetFallbackProvider = jest.fn();
const mockGetFallbackModelId = jest.fn();
const mockGetParametersForRole = jest.fn();
const mockGetUserId = jest.fn();
const mockGetDebugFlag = jest.fn();
const mockIsApiKeySet = jest.fn();
const mockGetAzureEndpoint = jest.fn(); // Added for Azure

// --- Mock MODEL_MAP Data ---
const mockModelMap = {
  azure: [
    {
      id: "gpt-4o",
      cost_per_1m_tokens: { input: 5, output: 15, currency: "USD" },
    },
    {
      id: "gpt-4o-mini",
      cost_per_1m_tokens: { input: 0.15, output: 0.6, currency: "USD" },
    },
    {
      id: "o3-mini", // Assuming this is an Azure model based on TASK.md
      cost_per_1m_tokens: { input: 0.1, output: 0.5, currency: "USD" }, // Example cost
    },
  ],
};
const mockGetBaseUrlForRole = jest.fn();

jest.unstable_mockModule("../../scripts/modules/config-manager.js", () => ({
  getMainProvider: mockGetMainProvider,
  getMainModelId: mockGetMainModelId,
  // getResearchProvider and getResearchModelId removed
  getFallbackProvider: mockGetFallbackProvider,
  getFallbackModelId: mockGetFallbackModelId,
  getParametersForRole: mockGetParametersForRole,
  getUserId: mockGetUserId,
  getDebugFlag: mockGetDebugFlag,
  MODEL_MAP: mockModelMap,
  getBaseUrlForRole: mockGetBaseUrlForRole, // Retained as Azure might use a base URL/endpoint
  isApiKeySet: mockIsApiKeySet,
  getAzureEndpoint: mockGetAzureEndpoint, // Added for Azure
}));

// Mock AI Provider Modules
const mockGenerateAzureText = jest.fn();
const mockStreamAzureText = jest.fn();
const mockGenerateAzureObject = jest.fn();
jest.unstable_mockModule("../../src/ai-providers/azure.js", () => ({
  generateAzureText: mockGenerateAzureText,
  streamAzureText: mockStreamAzureText,
  generateAzureObject: mockGenerateAzureObject,
}));

// Mock utils logger, API key resolver, AND findProjectRoot
const mockLog = jest.fn();
const mockResolveEnvVariable = jest.fn();
const mockFindProjectRoot = jest.fn();
const mockIsSilentMode = jest.fn();
const mockLogAiUsage = jest.fn();

jest.unstable_mockModule("../../scripts/modules/utils.js", () => ({
  log: mockLog,
  resolveEnvVariable: mockResolveEnvVariable,
  findProjectRoot: mockFindProjectRoot,
  isSilentMode: mockIsSilentMode,
  logAiUsage: mockLogAiUsage,
}));

// Import the module to test (AFTER mocks)
const { generateTextService } = await import(
  "../../scripts/modules/ai-services-unified.js"
);

describe("Unified AI Services", () => {
  const fakeProjectRoot = "/fake/project/root"; // Define for reuse

  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks(); // Clears all mocks

    // Set default mock behaviors
    mockGetMainProvider.mockReturnValue("azure");
    mockGetMainModelId.mockReturnValue("gpt-4o");
    // Research provider/model removed
    mockGetFallbackProvider.mockReturnValue("azure");
    mockGetFallbackModelId.mockReturnValue("gpt-4o-mini");
    mockGetParametersForRole.mockImplementation((role) => {
      if (role === "main") return { maxTokens: 100, temperature: 0.5 };
      // Research role removed
      if (role === "fallback") return { maxTokens: 150, temperature: 0.6 };
      return { maxTokens: 100, temperature: 0.5 }; // Default
    });
    mockResolveEnvVariable.mockImplementation((key) => {
      if (key === "AZURE_OPENAI_API_KEY") return "mock-azure-api-key";
      if (key === "AZURE_OPENAI_ENDPOINT")
        return "https://mock.openai.azure.com/";
      return null;
    });
    mockGetAzureEndpoint.mockReturnValue("https://mock.openai.azure.com/");
    mockGetBaseUrlForRole.mockReturnValue("https://mock.openai.azure.com/"); // Azure uses an endpoint/base URL

    // Set a default behavior for the new mock
    mockFindProjectRoot.mockReturnValue(fakeProjectRoot);
    mockGetDebugFlag.mockReturnValue(false);
    mockGetUserId.mockReturnValue("test-user-id"); // Add default mock for getUserId
    mockIsApiKeySet.mockReturnValue(true); // Default to true for Azure (API key + endpoint)
  });

  describe("generateTextService", () => {
    test("should use main provider/model (Azure) and succeed", async () => {
      mockGenerateAzureText.mockResolvedValue({
        text: "Main Azure provider response",
        usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
      });

      const params = {
        role: "main",
        session: { env: {} },
        systemPrompt: "System",
        prompt: "Test",
      };
      const result = await generateTextService(params);

      expect(result.mainResult).toBe("Main Azure provider response");
      expect(result).toHaveProperty("telemetryData");
      expect(mockGetMainProvider).toHaveBeenCalled();
      expect(mockGetMainModelId).toHaveBeenCalled();
      expect(mockGetParametersForRole).toHaveBeenCalledWith(
        "main",
        fakeProjectRoot,
      );
      expect(mockResolveEnvVariable).toHaveBeenCalledWith(
        "AZURE_OPENAI_API_KEY",
        params.session,
        fakeProjectRoot,
      );
      expect(mockGetBaseUrlForRole).toHaveBeenCalledWith(
        "main",
        fakeProjectRoot,
      );
      expect(mockGenerateAzureText).toHaveBeenCalledTimes(1);
      expect(mockGenerateAzureText).toHaveBeenCalledWith({
        apiKey: "mock-azure-api-key",
        modelId: "gpt-4o", // From beforeEach
        maxTokens: 100,
        temperature: 0.5,
        messages: [
          { role: "system", content: "System" },
          { role: "user", content: "Test" },
        ],
        baseUrl: "https://mock.openai.azure.com/",
      });
    });

    test("should fall back to fallback Azure provider/model if main Azure fails", async () => {
      const mainError = new Error("Main Azure provider failed");
      mockGenerateAzureText // Use mockGenerateAzureText
        .mockRejectedValueOnce(mainError)
        .mockResolvedValueOnce({
          text: "Fallback Azure provider response",
          usage: { inputTokens: 15, outputTokens: 25, totalTokens: 40 },
        });

      const params = {
        role: "main",
        session: { env: {} },
        systemPrompt: "System",
        prompt: "Test",
      };
      const result = await generateTextService(params);

      expect(result.mainResult).toBe("Fallback Azure provider response");
      // Note: telemetryData doesn't contain error in the new implementation
      expect(result.telemetryData).toBeDefined();

      expect(mockGetMainProvider).toHaveBeenCalled();
      expect(mockGetFallbackProvider).toHaveBeenCalled();
      expect(mockGenerateAzureText).toHaveBeenCalledTimes(2); // Called for main, then fallback

      // Check API key resolution (assuming resolved for each attempt)
      expect(mockResolveEnvVariable).toHaveBeenCalledWith(
        "AZURE_OPENAI_API_KEY",
        params.session,
        fakeProjectRoot,
      );
      // Called twice for main and fallback
      expect(mockResolveEnvVariable).toHaveBeenCalledTimes(2);
      expect(mockGetBaseUrlForRole).toHaveBeenCalledWith(
        "main",
        fakeProjectRoot,
      );
      expect(mockGetBaseUrlForRole).toHaveBeenCalledWith(
        "fallback",
        fakeProjectRoot,
      );

      // First call (main Azure - fails)
      expect(mockGenerateAzureText).toHaveBeenNthCalledWith(1, {
        apiKey: "mock-azure-api-key",
        modelId: "gpt-4o", // Main Azure model (from beforeEach)
        maxTokens: 100,
        temperature: 0.5,
        messages: [
          { role: "system", content: "System" },
          { role: "user", content: "Test" },
        ],
        baseUrl: "https://mock.openai.azure.com/",
      });

      // Second call (fallback Azure - succeeds)
      expect(mockGenerateAzureText).toHaveBeenNthCalledWith(2, {
        apiKey: "mock-azure-api-key",
        modelId: "gpt-4o-mini", // Fallback Azure model (from beforeEach)
        maxTokens: 150, // Fallback params (from beforeEach)
        temperature: 0.6, // Fallback params (from beforeEach)
        messages: [
          { role: "system", content: "System" },
          { role: "user", content: "Test" },
        ],
        baseUrl: "https://mock.openai.azure.com/",
      });

      // Check that error was logged
      expect(mockLog).toHaveBeenCalledWith(
        "error",
        expect.stringContaining("Service call failed for role main"),
      );
    });

    test("should throw error if main and fallback Azure attempts fail", async () => {
      const azureMainError = new Error("Azure main failed");
      const azureFallbackError = new Error("Azure fallback failed");
      mockGenerateAzureText
        .mockRejectedValueOnce(azureMainError)
        .mockRejectedValueOnce(azureFallbackError);

      const params = {
        role: "main",
        session: { env: {} },
        prompt: "All Azure fail test",
      };

      await expect(generateTextService(params)).rejects.toThrow(
        "Azure fallback failed", // Error from the last attempt (fallback Azure)
      );

      expect(mockGenerateAzureText).toHaveBeenCalledTimes(2); // main Azure, fallback Azure
      expect(mockLog).toHaveBeenCalledWith(
        "error",
        expect.stringContaining("Service call failed for role main"),
      );
      expect(mockLog).toHaveBeenCalledWith(
        "error",
        expect.stringContaining("Service call failed for role fallback"),
      );
    });

    test("should handle retryable errors correctly for Azure", async () => {
      const retryableError = new Error("Rate limit"); // Example of a retryable error
      mockGenerateAzureText
        .mockRejectedValueOnce(retryableError) // Fails once
        .mockResolvedValueOnce({
          // Succeeds on retry
          text: "Success after Azure retry",
          usage: { inputTokens: 5, outputTokens: 10, totalTokens: 15 },
        });

      const params = {
        role: "main",
        session: { env: {} },
        prompt: "Azure retry success test",
      };
      const result = await generateTextService(params);

      expect(result.mainResult).toBe("Success after Azure retry");
      expect(result).toHaveProperty("telemetryData");
      expect(mockGenerateAzureText).toHaveBeenCalledTimes(2); // Initial + 1 retry
      expect(mockLog).toHaveBeenCalledWith(
        "info",
        expect.stringContaining(
          "Something went wrong on the provider side. Retrying in",
        ),
      );
    });

    test("should use null project root for Azure if findProjectRoot returns null", async () => {
      mockFindProjectRoot.mockReturnValue(null); // Simulate not finding root
      mockGenerateAzureText.mockResolvedValue({
        text: "Azure response with no root",
        usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
      });

      const params = {
        role: "main",
        session: { env: {} },
        prompt: "No root test for Azure",
      }; // No explicit root passed
      await generateTextService(params);

      expect(mockGetMainProvider).toHaveBeenCalledWith(null);
      expect(mockGetParametersForRole).toHaveBeenCalledWith("main", null);
      expect(mockResolveEnvVariable).toHaveBeenCalledWith(
        "AZURE_OPENAI_API_KEY",
        params.session,
        null,
      );
      expect(mockGetBaseUrlForRole).toHaveBeenCalledWith("main", null);
      expect(mockGenerateAzureText).toHaveBeenCalledTimes(1);
      expect(mockGenerateAzureText).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: "mock-azure-api-key",
          baseUrl: "https://mock.openai.azure.com/",
        }),
      );
    });

    test("should skip main Azure if API key/endpoint missing and try fallback Azure", async () => {
      // Setup isApiKeySet: false for main Azure attempt, true for fallback Azure attempt
      mockIsApiKeySet
        .mockReturnValueOnce(false) // Main Azure fails API key check
        .mockReturnValueOnce(true); // Fallback Azure passes API key check

      // Mock Azure text response for the fallback call
      mockGenerateAzureText.mockResolvedValue({
        text: "Fallback Azure response after skip",
        usage: { inputTokens: 20, outputTokens: 30, totalTokens: 50 },
      });

      const params = {
        role: "main",
        prompt: "Skip main Azure test",
        session: { env: {} },
      };

      const result = await generateTextService(params);

      expect(result.mainResult).toBe("Fallback Azure response after skip");

      // Should check API keys for both main and fallback Azure attempts
      expect(mockIsApiKeySet).toHaveBeenNthCalledWith(
        1,
        "azure",
        params.session,
        fakeProjectRoot,
      );
      expect(mockIsApiKeySet).toHaveBeenNthCalledWith(
        2,
        "azure",
        params.session,
        fakeProjectRoot,
      );
      expect(mockIsApiKeySet).toHaveBeenCalledTimes(2);

      // Should log a warning for the skipped main Azure attempt
      expect(mockLog).toHaveBeenCalledWith(
        "warn",
        expect.stringContaining(
          `Skipping role 'main' (Provider: azure): API key not set or invalid.`,
        ),
      );

      // Should call Azure provider for the fallback attempt
      expect(mockGenerateAzureText).toHaveBeenCalledTimes(1);
      expect(mockGenerateAzureText).toHaveBeenCalledWith(
        expect.objectContaining({
          modelId: "gpt-4o-mini", // Fallback model
        }),
      );
    });

    test("should throw error if API key/endpoint missing for both main and fallback Azure", async () => {
      // Mock API key/endpoint as missing for both Azure attempts
      mockIsApiKeySet.mockReturnValue(false);

      const params = {
        role: "main",
        prompt: "All Azure API keys missing test",
        session: { env: {} },
      };

      await expect(generateTextService(params)).rejects.toThrow(
        "AI service call failed for all configured roles",
      );

      // Should log warnings for both skipped Azure attempts
      expect(mockLog).toHaveBeenCalledWith(
        "warn",
        expect.stringContaining(
          `Skipping role 'main' (Provider: azure): API key not set or invalid.`,
        ),
      );
      expect(mockLog).toHaveBeenCalledWith(
        "warn",
        expect.stringContaining(
          `Skipping role 'fallback' (Provider: azure): API key not set or invalid.`,
        ),
      );

      // Should log final error
      expect(mockLog).toHaveBeenCalledWith(
        "error",
        expect.stringContaining(
          "All roles in the sequence [main, fallback] failed.",
        ),
      );
    });

    test("should use custom session for Azure API key and endpoint", async () => {
      const customSession = {
        env: {
          AZURE_OPENAI_API_KEY: "session-azure-api-key",
          AZURE_OPENAI_ENDPOINT: "https://session.openai.azure.com/",
        },
      };

      // Setup API key check to verify the session is passed correctly
      mockIsApiKeySet.mockImplementation((provider, session, root) => {
        // Only return true if the correct session was provided and provider is azure
        return provider === "azure" && session === customSession;
      });

      mockResolveEnvVariable.mockImplementation((key, session) => {
        if (session === customSession) {
          if (key === "AZURE_OPENAI_API_KEY")
            return customSession.env.AZURE_OPENAI_API_KEY;
          if (key === "AZURE_OPENAI_ENDPOINT")
            return customSession.env.AZURE_OPENAI_ENDPOINT;
        }
        return null; // Default mock behavior for other cases
      });

      mockGetBaseUrlForRole.mockImplementation(() => {
        return "https://session.openai.azure.com/"; // Return session endpoint
      });

      // Mock the Azure response
      mockGenerateAzureText.mockResolvedValue({
        text: "Azure response with session key/endpoint",
        usage: { inputTokens: 10, outputTokens: 10, totalTokens: 20 },
      });

      const params = {
        role: "main",
        prompt: "Session Azure API key test",
        session: customSession,
      };

      const result = await generateTextService(params);

      // Should check API key with the custom session for Azure
      expect(mockIsApiKeySet).toHaveBeenCalledWith(
        "azure",
        customSession,
        fakeProjectRoot,
      );

      // Ensure resolveEnvVariable was called with the session
      expect(mockResolveEnvVariable).toHaveBeenCalledWith(
        "AZURE_OPENAI_API_KEY",
        customSession,
        fakeProjectRoot,
      );
      expect(mockGetBaseUrlForRole).toHaveBeenCalledWith(
        "main",
        fakeProjectRoot,
      );

      // Should have gotten the Azure response
      expect(result.mainResult).toBe(
        "Azure response with session key/endpoint",
      );
      expect(mockGenerateAzureText).toHaveBeenCalledTimes(1);
      expect(mockGenerateAzureText).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: "session-azure-api-key",
          baseUrl: "https://session.openai.azure.com/",
        }),
      );
    });
  });
});
