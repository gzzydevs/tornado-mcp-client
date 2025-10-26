# GitHub Models API Authentication Guide

This guide explains how to use GitHub Models API with Tornado MCP Client using a GitHub Personal Access Token.

## What is GitHub Models API?

GitHub Models API provides access to various AI models (including GPT-4, GPT-4o, Phi-3, etc.) through GitHub's infrastructure. This is different from GitHub Copilot and doesn't require a Copilot subscription.

## Getting a GitHub Personal Access Token

1. **Go to GitHub Settings**
   - Visit: https://github.com/settings/tokens
   - Or navigate: GitHub Profile → Settings → Developer settings → Personal access tokens → Tokens (classic)

2. **Generate New Token**
   - Click "Generate new token (classic)"
   - Give it a descriptive name like "Tornado MCP Client"
   - Set expiration (recommended: 90 days or No expiration for personal use)
   - **Important**: No specific scopes are required for GitHub Models API
   - Click "Generate token"

3. **Copy the Token**
   - **Important**: Copy the token immediately - you won't be able to see it again!
   - Store it securely (e.g., in your password manager)

## Using GitHub Token with Tornado MCP Client

### Option 1: Environment Variable (Recommended)

Create a `.env` file in your project root:

```bash
GITHUB_TOKEN=ghp_your_token_here
```

Then use it in your code:

```typescript
import { MCPClient } from './src/main/mcp';

const client = new MCPClient({
  mode: 'api-key',
  aiModel: {
    provider: 'github-copilot',  // Uses GitHub Models API
    model: 'gpt-4o',  // Available: gpt-4o, gpt-4o-mini, gpt-4-turbo, etc.
    apiKey: process.env.GITHUB_TOKEN!,
    maxTokens: 4096,
    temperature: 1.0,
  },
  sampling: {
    strategy: 'full',
    maxTokens: 1000,
  },
  servers: [
    // Your MCP servers
  ],
});

await client.initialize();
```

### Option 2: Direct Configuration (Not Recommended for Production)

```typescript
const client = new MCPClient({
  mode: 'api-key',
  aiModel: {
    provider: 'github-copilot',
    model: 'gpt-4o',
    apiKey: 'ghp_your_token_here',  // Replace with your token
  },
  sampling: {
    strategy: 'full',
    maxTokens: 1000,
  },
  servers: [],
});
```

## Available Models

GitHub Models API provides access to various models:

- **GPT-4o** (`gpt-4o`) - Most capable, best for complex tasks
- **GPT-4o Mini** (`gpt-4o-mini`) - Faster, more affordable
- **GPT-4 Turbo** (`gpt-4-turbo`) - Previous generation
- **Phi-3** models - Microsoft's lightweight models

Example with different models:

```typescript
// Using GPT-4o (recommended)
const config = {
  mode: 'api-key' as const,
  aiModel: {
    provider: 'github-copilot' as const,
    model: 'gpt-4o',
    apiKey: process.env.GITHUB_TOKEN!,
  },
  // ...
};

// Using GPT-4o Mini (faster, cheaper)
const miniConfig = {
  mode: 'api-key' as const,
  aiModel: {
    provider: 'github-copilot' as const,
    model: 'gpt-4o-mini',
    apiKey: process.env.GITHUB_TOKEN!,
  },
  // ...
};
```

## Complete Example

Here's a complete example using GitHub Models API with Hollow Knight MCP:

```typescript
import { MCPClient } from './src/main/mcp';
import type { MCPClientConfig, ChatMessage, RawContext } from './src/shared/mcp-types';

// Configuration
const config: MCPClientConfig = {
  mode: 'api-key',
  aiModel: {
    provider: 'github-copilot',
    model: 'gpt-4o',
    apiKey: process.env.GITHUB_TOKEN!,
    maxTokens: 4096,
    temperature: 0.7,
  },
  sampling: {
    strategy: 'chunked',
    maxTokens: 1500,
    chunkSize: 500,
    overlap: 50,
    priority: {
      savefile: 2,
      screenshot: 1,
      guide: 1,
    },
  },
  servers: [
    {
      id: 'hollow-knight',
      name: 'Hollow Knight MCP',
      command: 'node',
      args: ['./mcps/hollow-knight-mcp/dist/index.js'],
      enabled: true,
    },
  ],
};

// Initialize
const client = new MCPClient(config);
await client.initialize();

// Use the client
const messages: ChatMessage[] = [
  {
    role: 'user',
    content: 'What boss should I fight next?',
    timestamp: new Date(),
  },
];

const response = await client.chat(messages);
console.log('AI Response:', response);

// Cleanup
await client.cleanup();
```

## Troubleshooting

### Error: "Invalid authentication credentials"
- Check that your token is correct and hasn't expired
- Ensure you're using a Personal Access Token (classic), not a fine-grained token
- Generate a new token if needed

### Error: "Rate limit exceeded"
- GitHub Models API has rate limits
- Wait a few minutes before trying again
- Consider using exponential backoff in your application

### Model not available
- Check the model name is correct
- Some models may not be available in all regions
- Try using `gpt-4o` or `gpt-4o-mini` as they are widely available

## Comparison: GitHub Models vs Direct OpenAI

### GitHub Models API (with GitHub Token)
- ✅ Free tier available
- ✅ No credit card required initially
- ✅ Easy to get started
- ⚠️ Rate limits may be more restrictive
- ⚠️ Fewer model options than direct OpenAI

### Direct OpenAI API
- ✅ More models available
- ✅ Higher rate limits
- ✅ Better for production use
- ❌ Requires payment method
- ❌ Pay per token

Choose based on your needs:
- **Development/Testing**: GitHub Models API
- **Production**: Direct OpenAI API

## Switching Between Providers

You can easily switch between providers by changing the configuration:

```typescript
// Switch to OpenAI
client.updateAIConfig({
  provider: 'openai',
  model: 'gpt-4-turbo-preview',
  apiKey: process.env.OPENAI_API_KEY,
});

// Switch to Anthropic
client.updateAIConfig({
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022',
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Switch back to GitHub
client.updateAIConfig({
  provider: 'github-copilot',
  model: 'gpt-4o',
  apiKey: process.env.GITHUB_TOKEN,
});
```

## Security Best Practices

1. **Never commit tokens to git**
   - Add `.env` to `.gitignore`
   - Use environment variables

2. **Rotate tokens periodically**
   - Set expiration dates
   - Regenerate tokens every 90 days

3. **Use minimal permissions**
   - GitHub tokens for Models API don't need any scopes
   - Don't grant unnecessary permissions

4. **Monitor usage**
   - Check your API usage regularly
   - Set up alerts for unusual activity

## Additional Resources

- [GitHub Models Documentation](https://docs.github.com/en/github-models)
- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Tornado MCP Client Documentation](./src/main/mcp/README.md)
