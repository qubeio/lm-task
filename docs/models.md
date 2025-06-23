# Available Azure OpenAI Models

This version of LM-Tasker is configured to work exclusively with Azure OpenAI services for corporate deployment.

## Main Models

| Provider | Model Name  | SWE Score | Input Cost | Output Cost |
| -------- | ----------- | --------- | ---------- | ----------- |
| azure    | gpt-4o      | 0.332     | 2.5        | 10          |
| azure    | gpt-4o-mini | 0.3       | 0.15       | 0.6         |
| azure    | o3-mini     | 0.493     | 1.1        | 4.4         |

## Fallback Models

| Provider | Model Name  | SWE Score | Input Cost | Output Cost |
| -------- | ----------- | --------- | ---------- | ----------- |
| azure    | gpt-4o      | 0.332     | 2.5        | 10          |
| azure    | gpt-4o-mini | 0.3       | 0.15       | 0.6         |
| azure    | o3-mini     | 0.493     | 1.1        | 4.4         |

## Configuration

To configure these models, use:

```bash
# Set the main model
task-master models --set-main=gpt-4o

# Set the fallback model
task-master models --set-fallback=gpt-4o-mini
```

Or use the interactive setup:

```bash
task-master models --setup
```

## Notes

- **Cost**: Costs are expressed in dollars per million tokens (e.g., 2.5 = $2.50 per million input tokens)
- **SWE Score**: Software Engineering benchmark score (higher is better)
- **Azure Endpoint**: You must configure your Azure OpenAI endpoint in the `.taskmasterconfig` file or via environment variables
- **API Keys**: Both `AZURE_OPENAI_API_KEY` and `AZURE_OPENAI_ENDPOINT` are required
