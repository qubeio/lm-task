import { z } from "zod";
import { log } from "../../scripts/modules/utils.js";

/**
 * Makes a direct API call to Azure OpenAI
 * @param {string} endpoint - The full endpoint URL
 * @param {string} apiKey - The API key
 * @param {object} body - The request body
 * @returns {Promise<object>} The API response
 */
async function callAzureAPI(endpoint, apiKey, body) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Azure OpenAI API error: ${response.status} ${response.statusText}. ${
        errorData.error?.message || JSON.stringify(errorData)
      }`,
    );
  }

  return response.json();
}

/**
 * Generates text using Azure OpenAI models via direct API call.
 *
 * @param {object} params - Parameters including apiKey, modelId, messages, maxTokens, temperature, baseUrl.
 * @returns {Promise<object>} The generated text content and usage.
 * @throws {Error} If API call fails.
 */
export async function generateAzureText(params) {
  const { apiKey, modelId, messages, maxTokens, temperature, baseUrl } = params;
  log("debug", `generateAzureText called with model: ${modelId}`);

  if (!apiKey) {
    throw new Error("Azure OpenAI API key is required.");
  }
  if (!modelId) {
    throw new Error("Azure OpenAI Model ID is required.");
  }
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw new Error(
      "Invalid or empty messages array provided for Azure OpenAI.",
    );
  }
  if (!baseUrl) {
    throw new Error("Azure OpenAI base URL is required.");
  }

  // Construct the endpoint URL
  const endpoint = `${baseUrl}/openai/deployments/${modelId}/chat/completions?api-version=2025-01-01-preview`;

  const body = {
    messages,
    max_tokens: maxTokens,
  };

  // Only add temperature for models that support it (not o3/o3-mini)
  if (modelId !== "o3" && modelId !== "o3-mini") {
    body.temperature = temperature || 0.7;
  }

  try {
    const result = await callAzureAPI(endpoint, apiKey, body);

    if (!result.choices || !result.choices[0]?.message?.content) {
      log(
        "warn",
        "Azure OpenAI generateText response did not contain expected content.",
        { result },
      );
      throw new Error("Failed to extract content from Azure OpenAI response.");
    }

    log(
      "debug",
      `Azure OpenAI generateText completed successfully for model: ${modelId}`,
    );

    return {
      text: result.choices[0].message.content.trim(),
      usage: {
        inputTokens: result.usage?.prompt_tokens || 0,
        outputTokens: result.usage?.completion_tokens || 0,
      },
    };
  } catch (error) {
    log(
      "error",
      `Error in generateAzureText (Model: ${modelId}): ${error.message}`,
      { error },
    );
    throw new Error(
      `Azure OpenAI API error during text generation: ${error.message}`,
    );
  }
}

/**
 * Streams text using Azure OpenAI models via direct API call.
 * Note: This returns an async generator that yields text chunks
 *
 * @param {object} params - Parameters including apiKey, modelId, messages, maxTokens, temperature, baseUrl.
 * @returns {Promise<AsyncGenerator>} An async generator that yields text chunks.
 * @throws {Error} If API call fails.
 */
export async function streamAzureText(params) {
  const { apiKey, modelId, messages, maxTokens, temperature, baseUrl } = params;
  log("debug", `streamAzureText called with model: ${modelId}`);

  if (!apiKey) {
    throw new Error("Azure OpenAI API key is required.");
  }
  if (!modelId) {
    throw new Error("Azure OpenAI Model ID is required.");
  }
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw new Error(
      "Invalid or empty messages array provided for Azure OpenAI streaming.",
    );
  }
  if (!baseUrl) {
    throw new Error("Azure OpenAI base URL is required.");
  }

  // Construct the endpoint URL
  const endpoint = `${baseUrl}/openai/deployments/${modelId}/chat/completions?api-version=2025-01-01-preview`;

  const body = {
    messages,
    max_tokens: maxTokens,
    stream: true,
  };

  // Only add temperature for models that support it (not o3/o3-mini)
  if (modelId !== "o3" && modelId !== "o3-mini") {
    body.temperature = temperature || 0.7;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Azure OpenAI API error: ${response.status} ${response.statusText}. ${
          errorData.error?.message || JSON.stringify(errorData)
        }`,
      );
    }

    log(
      "debug",
      `Azure OpenAI streamText initiated successfully for model: ${modelId}`,
    );

    // Return an object that mimics the Vercel AI SDK stream structure
    return {
      textStream: createTextStreamFromResponse(response),
      // Add other properties as needed for compatibility
    };
  } catch (error) {
    log(
      "error",
      `Error initiating Azure OpenAI stream (Model: ${modelId}): ${error.message}`,
      { error },
    );
    throw new Error(
      `Azure OpenAI API error during streaming initiation: ${error.message}`,
    );
  }
}

/**
 * Creates a text stream from the Azure OpenAI response
 * @param {Response} response - The fetch Response object
 * @returns {AsyncGenerator<string>} An async generator that yields text chunks
 */
async function* createTextStreamFromResponse(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Generates structured objects using Azure OpenAI models via direct API call.
 *
 * @param {object} params - Parameters including apiKey, modelId, messages, schema, objectName, maxTokens, temperature, baseUrl.
 * @returns {Promise<object>} The generated object matching the schema and usage.
 * @throws {Error} If API call fails or object generation fails.
 */
export async function generateAzureObject(params) {
  const {
    apiKey,
    modelId,
    messages,
    schema,
    objectName,
    maxTokens,
    temperature,
    baseUrl,
  } = params;
  log(
    "debug",
    `generateAzureObject called with model: ${modelId}, object: ${objectName}`,
  );

  if (!apiKey) throw new Error("Azure OpenAI API key is required.");
  if (!modelId) throw new Error("Azure OpenAI Model ID is required.");
  if (!messages || !Array.isArray(messages) || messages.length === 0)
    throw new Error(
      "Invalid messages array for Azure OpenAI object generation.",
    );
  if (!schema)
    throw new Error("Schema is required for Azure OpenAI object generation.");
  if (!objectName)
    throw new Error(
      "Object name is required for Azure OpenAI object generation.",
    );
  if (!baseUrl) {
    throw new Error("Azure OpenAI base URL is required.");
  }

  // Convert Zod schema to JSON Schema for Azure OpenAI
  function zodToJsonSchema(zodSchema) {
    // Get the schema definition
    const schemaDef = zodSchema._def;

    if (schemaDef.typeName === "ZodObject") {
      const properties = {};
      const required = [];

      const shape = schemaDef.shape();

      for (const [key, value] of Object.entries(shape)) {
        let fieldSchema;
        let isOptional = false;

        // Handle optional fields
        if (value._def.typeName === "ZodOptional") {
          isOptional = true;
          fieldSchema = zodToJsonSchema(value._def.innerType);
        } else {
          fieldSchema = zodToJsonSchema(value);
        }

        // Add description if available
        if (value._def.description || value._def.innerType?._def.description) {
          fieldSchema.description =
            value._def.description || value._def.innerType._def.description;
        }

        properties[key] = fieldSchema;

        // For Azure OpenAI 2025-01-01-preview, ALL properties must be in required array
        // Add EVERY key to required array regardless of whether it's optional
        required.push(key);
      }

      return {
        type: "object",
        properties,
        required,
        additionalProperties: false,
      };
    } else if (schemaDef.typeName === "ZodArray") {
      return {
        type: "array",
        items: zodToJsonSchema(schemaDef.type),
      };
    } else if (schemaDef.typeName === "ZodString") {
      return { type: "string" };
    } else if (schemaDef.typeName === "ZodNumber") {
      return { type: "number" };
    } else if (schemaDef.typeName === "ZodBoolean") {
      return { type: "boolean" };
    } else if (schemaDef.typeName === "ZodEnum") {
      return {
        type: "string",
        enum: schemaDef.values,
      };
    } else {
      // Default fallback
      return { type: "string" };
    }
  }

  // Construct the endpoint URL
  const endpoint = `${baseUrl}/openai/deployments/${modelId}/chat/completions?api-version=2025-01-01-preview`;

  // Convert Zod schema to JSON Schema
  const jsonSchema = zodToJsonSchema(schema);

  // Debug log the generated schema
  log(
    "debug",
    `Generated JSON Schema for ${objectName}:`,
    JSON.stringify(jsonSchema, null, 2),
  );

  // Create the function definition for Azure OpenAI
  const functionDef = {
    name: "json",
    description: "Respond with a JSON object.",
    parameters: jsonSchema,
  };

  // Add system message to ensure all fields are included
  const enhancedMessages = [
    {
      role: "developer",
      content: `IMPORTANT: You must include ALL fields in your JSON response, even if they would normally be optional. For any optional fields that don't apply, use appropriate default values:
- For optional string fields: use empty string ""
- For optional array fields: use empty array []
- For optional number fields: use 0
- For optional boolean fields: use false

This ensures compatibility with Azure OpenAI's strict schema validation.`,
    },
    ...messages,
  ];

  const body = {
    messages: enhancedMessages,
    tool_choice: {
      type: "function",
      function: {
        name: "json",
      },
    },
    tools: [
      {
        type: "function",
        function: functionDef,
      },
    ],
  };

  // Only add temperature for models that support it (not o3/o3-mini)
  if (modelId !== "o3" && modelId !== "o3-mini") {
    body.temperature = temperature || 0.7;
  }

  // Only add max_tokens if it's provided and reasonable
  if (maxTokens && maxTokens > 0) {
    // For o3-mini, use max_completion_tokens instead of max_tokens
    if (modelId === "o3-mini" || modelId === "o3") {
      body.max_completion_tokens = Math.min(maxTokens, 50000);
    } else {
      body.max_tokens = maxTokens;
    }
  }

  try {
    const result = await callAzureAPI(endpoint, apiKey, body);

    if (!result.choices || !result.choices[0]?.message?.tool_calls?.[0]) {
      log(
        "warn",
        "Azure OpenAI generateObject response did not contain expected tool call.",
        { result },
      );
      throw new Error("Failed to extract object from Azure OpenAI response.");
    }

    const toolCall = result.choices[0].message.tool_calls[0];
    const generatedObject = JSON.parse(toolCall.function.arguments);

    log(
      "debug",
      `Azure OpenAI generateObject completed successfully for model: ${modelId}`,
    );

    return {
      object: generatedObject,
      usage: {
        inputTokens: result.usage?.prompt_tokens || 0,
        outputTokens: result.usage?.completion_tokens || 0,
      },
    };
  } catch (error) {
    log(
      "error",
      `Error in generateAzureObject (Model: ${modelId}, Object: ${objectName}): ${error.message}`,
      { error },
    );
    throw new Error(
      `Azure OpenAI API error during object generation: ${error.message}`,
    );
  }
}
