# MCP Client Usage Examples

This document provides practical examples of using the Tornado MCP Client in different scenarios.

## Example 1: Basic Setup with Anthropic (Claude)

```typescript
import { MCPClient } from './src/main/mcp';
import type { MCPClientConfig } from './src/shared/mcp-types';

// Configure the client with Anthropic
const config: MCPClientConfig = {
  mode: 'api-key',
  aiModel: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    apiKey: process.env.ANTHROPIC_API_KEY!,
    maxTokens: 4096,
    temperature: 1.0,
  },
  sampling: {
    strategy: 'full',
    maxTokens: 1000,
    priority: {
      savefile: 2,  // 50% of context budget
      screenshot: 1, // 25% of context budget
      guide: 1,      // 25% of context budget
    },
  },
  servers: [
    {
      id: 'hollow-knight',
      name: 'Hollow Knight MCP',
      command: 'node',
      args: ['./mcps/hollow-knight-mcp/dist/index.js'],
      enabled: true,
      metadata: {
        gameId: 'hollow-knight',
        description: 'MCP server for Hollow Knight game',
      },
    },
  ],
};

// Initialize the client
const mcpClient = new MCPClient(config);
await mcpClient.initialize();

console.log('MCP Client initialized!');
console.log('Available tools:', mcpClient.getAllTools());
```

## Example 1b: Using GitHub Models API (GitHub Copilot)

```typescript
// Configure the client with GitHub Models API
// Get your GitHub token from: https://github.com/settings/tokens
const githubConfig: MCPClientConfig = {
  mode: 'api-key',
  aiModel: {
    provider: 'github-copilot',
    model: 'gpt-4o',  // or 'gpt-4o-mini', 'gpt-4-turbo'
    apiKey: process.env.GITHUB_TOKEN!,  // GitHub Personal Access Token
    maxTokens: 4096,
    temperature: 1.0,
  },
  sampling: {
    strategy: 'full',
    maxTokens: 1000,
  },
  servers: [
    /* ... */
  ],
};

const client = new MCPClient(githubConfig);
await client.initialize();
```

## Example 1c: Using OpenAI

```typescript
// Configure the client with OpenAI
const openaiConfig: MCPClientConfig = {
  mode: 'api-key',
  aiModel: {
    provider: 'openai',
    model: 'gpt-4-turbo-preview',  // or 'gpt-4', 'gpt-3.5-turbo'
    apiKey: process.env.OPENAI_API_KEY!,
    maxTokens: 4096,
    temperature: 1.0,
  },
  sampling: {
    strategy: 'full',
    maxTokens: 1000,
  },
  servers: [
    /* ... */
  ],
};

const client = new MCPClient(openaiConfig);
await client.initialize();
```
```

## Example 2: Chat with Game Context

```typescript
import type { ChatMessage, RawContext } from './src/shared/mcp-types';

// Get savefile data from MCP tool
const savefileResult = await mcpClient.invokeTool({
  serverId: 'hollow-knight',
  toolName: 'analyze_savefile',
  arguments: {
    path: '/home/user/.config/unity3d/Team Cherry/Hollow Knight/user1.dat',
  },
});

// Get screenshot from MCP tool
const screenshotResult = await mcpClient.invokeTool({
  serverId: 'hollow-knight',
  toolName: 'take_screenshot',
  arguments: {},
});

// Get guide content from MCP tool
const guideResult = await mcpClient.invokeTool({
  serverId: 'hollow-knight',
  toolName: 'download_guide',
  arguments: {
    section: 'bosses',
  },
});

// Prepare raw context
const rawContext: RawContext = {
  savefile: {
    data: JSON.parse(savefileResult.content[0].text!),
    sizeBytes: savefileResult.content[0].text!.length,
  },
  screenshot: {
    data: screenshotResult.content[0].data!,
    sizeBytes: screenshotResult.content[0].data!.length,
  },
  guide: {
    text: guideResult.content[0].text!,
    sizeBytes: guideResult.content[0].text!.length,
  },
};

// Send chat message with context
const messages: ChatMessage[] = [
  {
    role: 'user',
    content: 'I\'m stuck on the Mantis Lords boss fight. What should I do?',
    timestamp: new Date(),
  },
];

const response = await mcpClient.chat(messages, rawContext);
console.log('AI Response:', response);
```

## Example 3: Multi-Game Setup

```typescript
const multiGameConfig: MCPClientConfig = {
  mode: 'api-key',
  aiModel: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    apiKey: process.env.ANTHROPIC_API_KEY!,
  },
  sampling: {
    strategy: 'chunked',
    maxTokens: 2000,
    chunkSize: 500,
    overlap: 50,
  },
  servers: [
    {
      id: 'hollow-knight',
      name: 'Hollow Knight MCP',
      command: 'node',
      args: ['./mcps/hollow-knight-mcp/dist/index.js'],
      enabled: true,
    },
    {
      id: 'dark-souls',
      name: 'Dark Souls MCP',
      command: 'node',
      args: ['./mcps/dark-souls-mcp/dist/index.js'],
      enabled: true,
    },
    {
      id: 'celeste',
      name: 'Celeste MCP',
      command: 'python',
      args: ['-m', 'celeste_mcp'],
      enabled: true,
    },
  ],
};

const client = new MCPClient(multiGameConfig);
await client.initialize();

// Check which servers are connected
const states = client.getServerStates();
for (const [serverId, state] of states) {
  console.log(`${serverId}: ${state.status}`);
  if (state.tools) {
    console.log(`  Tools: ${state.tools.map(t => t.name).join(', ')}`);
  }
}
```

## Example 4: Dynamic Server Management

```typescript
// Start with basic config
const client = new MCPClient({
  mode: 'api-key',
  aiModel: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    apiKey: process.env.ANTHROPIC_API_KEY!,
  },
  sampling: {
    strategy: 'selective',
    maxTokens: 1500,
  },
  servers: [],
});

await client.initialize();

// Add servers dynamically when games are detected
function onGameDetected(gameId: string, gamePath: string) {
  const serverConfig = {
    id: gameId,
    name: `${gameId} MCP`,
    command: 'node',
    args: [`./mcps/${gameId}-mcp/dist/index.js`],
    enabled: true,
    env: {
      GAME_PATH: gamePath,
    },
  };
  
  client.addServer(serverConfig);
  console.log(`Added MCP server for ${gameId}`);
}

// Subscribe to state changes
const unsubscribe = client.onServerStateChange((states) => {
  console.log('Server states updated:');
  for (const [serverId, state] of states) {
    console.log(`  ${serverId}: ${state.status}`);
  }
});

// Later: remove server when game closes
async function onGameClosed(gameId: string) {
  await client.removeServer(gameId);
  console.log(`Removed MCP server for ${gameId}`);
}
```

## Example 5: Adaptive Sampling Based on Context Size

```typescript
// Start with summary strategy for large guides
const client = new MCPClient({
  mode: 'api-key',
  aiModel: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    apiKey: process.env.ANTHROPIC_API_KEY!,
  },
  sampling: {
    strategy: 'summary',
    maxTokens: 1000,
  },
  servers: [
    /* ... */
  ],
});

await client.initialize();

// Switch to chunked strategy when user asks specific questions
client.updateSamplingConfig({
  strategy: 'chunked',
  chunkSize: 300,
  overlap: 30,
});

// Switch to selective strategy when focusing on savefile
client.updateSamplingConfig({
  strategy: 'selective',
  priority: {
    savefile: 4,
    screenshot: 1,
    guide: 0,
  },
});
```

## Example 6: Error Handling

```typescript
try {
  const client = new MCPClient(config);
  await client.initialize();
  
  // Subscribe to connection errors
  client.onServerStateChange((states) => {
    for (const [serverId, state] of states) {
      if (state.status === 'error') {
        console.error(`Server ${serverId} error:`, state.error);
        // Optionally: retry connection
        // client.connectServer(serverId);
      }
    }
  });
  
  // Handle chat errors
  try {
    const response = await client.chat(messages, rawContext);
    console.log(response);
  } catch (error) {
    console.error('Chat request failed:', error);
    // Fallback: try without context
    const fallbackResponse = await client.chat(messages);
    console.log('Fallback response:', fallbackResponse);
  }
  
} catch (error) {
  console.error('Failed to initialize MCP client:', error);
} finally {
  // Always cleanup
  await client.cleanup();
}
```

## Example 7: GitHub/VS Code Mode (Future)

```typescript
// Free tier access through GitHub Copilot
const freeConfig: MCPClientConfig = {
  mode: 'github-vscode',
  aiModel: {
    provider: 'github-copilot',
    model: 'gpt-4',
    // No API key required
  },
  sampling: {
    strategy: 'full',
    maxTokens: 800, // Conservative for free tier
  },
  servers: [
    /* ... */
  ],
};

const client = new MCPClient(freeConfig);
await client.initialize();

// Use same API as API key mode
const response = await client.chat(messages, rawContext);
```

## Example 8: Testing Configuration

```typescript
// Test configuration for unit tests
const testConfig: MCPClientConfig = {
  mode: 'api-key',
  aiModel: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    apiKey: 'test-key',
    maxTokens: 1000,
  },
  sampling: {
    strategy: 'full',
    maxTokens: 500,
  },
  servers: [],
};

const client = new MCPClient(testConfig);
await client.initialize();

// Mock MCP servers for testing
await client.addServer({
  id: 'test-server',
  name: 'Test MCP',
  command: 'node',
  args: ['./test/mock-mcp-server.js'],
  enabled: true,
});
```

## Best Practices

1. **Always cleanup**: Call `client.cleanup()` when done
2. **Handle errors**: Wrap calls in try-catch
3. **Monitor state**: Subscribe to state changes for connection issues
4. **Optimize sampling**: Adjust strategy based on use case
5. **Use priority weights**: Control token distribution between context types
6. **Test configurations**: Start with small token budgets and increase as needed
7. **Environment variables**: Store API keys in environment variables
8. **Resource management**: Remove unused servers to free resources

## Performance Tips

- Use `selective` strategy for large savefiles
- Use `chunked` strategy for large guides
- Set appropriate priority weights based on query type
- Monitor token usage and adjust maxTokens accordingly
- Disable unused MCP servers
- Cache frequently used tool results

## Security Notes

- Never commit API keys to source control
- Use environment variables for sensitive data
- Validate MCP server outputs before using
- Be careful with tool invocations that access file system
- Review MCP server permissions before enabling
