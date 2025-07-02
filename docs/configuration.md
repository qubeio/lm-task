# Configuration

LM-Tasker uses two primary methods for configuration:

1.  **`.lmtaskerconfig` File (Project Root - Recommended for most settings)**

    - This JSON file stores configuration settings for PRD parsing, including AI model selections, parameters, logging levels, and project defaults.
    - **Location:** This file is created in the root directory of your project when you run the `lm-tasker models --setup` interactive setup. You typically do this during the initialization sequence. Do not manually edit this file beyond adjusting Temperature and Max Tokens depending on your model.
    - **Management:** Use the `lm-tasker models --setup` command (or `models` MCP tool) to interactively create and manage this file. You can also set specific models directly using `lm-tasker models --set-main=<model_id>` or `lm-tasker models --set-fallback=<model_id>`. Manual editing is possible but not recommended unless you understand the structure.
    - **Example Structure:**
      ```json
      {
        "models": {
          "main": {
            "provider": "azure",
            "modelId": "gpt-4o",
            "maxTokens": 64000,
            "temperature": 0.2,
            "baseUrl": "https://your-endpoint.openai.azure.com/"
          },
          "fallback": {
            "provider": "azure",
            "modelId": "gpt-4o-mini",
            "maxTokens": 64000,
            "temperature": 0.2,
            "baseUrl": "https://your-endpoint.openai.azure.com/"
          }
        },
        "global": {
          "logLevel": "info",
          "debug": false,
          "defaultSubtasks": 5,
          "defaultPriority": "medium",
          "projectName": "Your Project Name",
          "azureOpenaiBaseUrl": "https://your-endpoint.openai.azure.com/"
        }
      }
      ```

2.  **Environment Variables (`.env` file or MCP `env` block - For API Keys Only)**
    - Used **exclusively** for sensitive API keys and specific endpoint URLs.
    - **Location:**
      - For CLI usage: Create a `.env` file in your project root.
      - For MCP/Cursor usage: Configure keys in the `env` section of your `.cursor/mcp.json` file.
    - **Required API Keys:**
      - `AZURE_OPENAI_API_KEY`: Your Azure OpenAI API key (required).
      - `AZURE_OPENAI_ENDPOINT`: Your Azure OpenAI endpoint URL (required).

**Important:** Settings like model ID selections (`main`, `fallback`), `maxTokens`, `temperature`, `logLevel`, `defaultSubtasks`, `defaultPriority`, and `projectName` are **managed in `.lmtaskerconfig`**, not environment variables. These models are used exclusively for PRD parsing operations.

## Example `.env` File (for API Keys)

```
# Required API keys for Azure OpenAI
AZURE_OPENAI_API_KEY=your-azure-openai-api-key-here
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com/
```

## Troubleshooting

### Configuration Errors

- If LM-Tasker reports errors about missing configuration or cannot find `.lmtaskerconfig`, run `lm-tasker models --setup` in your project root to create or repair the file.
- Ensure API keys are correctly placed in your `.env` file (for CLI) or `.cursor/mcp.json` (for MCP) and are valid for Azure OpenAI.

### If `lm-tasker init` doesn't respond:

Try running it with Node directly:

```bash
node node_modules/lm-tasker/scripts/init.js
```

Or clone the repository and run:

```bash
git clone https://github.com/your-org/lm-tasker.git
cd lm-tasker
node scripts/init.js
```
