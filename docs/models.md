# Available AI Models for PRD Parsing

LM-Tasker supports multiple AI providers for PRD parsing operations. AI functionality is limited to converting Product Requirements Documents into structured task lists.

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
# Set the main model for PRD parsing
lm-tasker models --set-main=gpt-4o

# Set the fallback model for PRD parsing
lm-tasker models --set-fallback=gpt-4o-mini
```

Or use the interactive setup:

```bash
lm-tasker models --setup
```

## Notes

- **Cost**: Costs are expressed in dollars per million tokens (e.g., 2.5 = $2.50 per million input tokens)
- **SWE Score**: Software Engineering benchmark score (higher is better)
- **Limited Usage**: Models are used exclusively for PRD parsing operations, not for task management
- **API Keys**: Provider-specific API keys are required only for PRD parsing functionality
- **Manual Operations**: All task management operations (create, update, modify) are manual for cost control and predictability
