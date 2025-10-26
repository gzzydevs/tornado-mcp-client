# MCP Core Client Module

This module provides the core MCP (Model Context Protocol) client implementation for Tornado MCP Client.

## Overview

The MCP core client handles:
- **Multiple MCP Server Connections**: Connect to and manage multiple MCP servers simultaneously
- **AI Model Integration**: Support for different AI providers (Anthropic, OpenAI, GitHub Copilot, etc.)
- **Context Sampling**: Intelligent sampling of context data to optimize token usage
- **Connection Modes**: Different modes for accessing AI models (API Key, GitHub/VS Code)

## Architecture

### Core Components

1. **MCPClient**: Main facade that orchestrates all components
2. **MCPConnectionManager**: Manages connections to multiple MCP servers
3. **AIConnectionMode**: Abstract base class for AI model connections
4. **ContextSampler**: Optimizes context data sent to AI models

### Connection Modes

#### API Key Mode
Direct connection to AI models using API keys. Supports multiple providers:

**Anthropic (Claude)**
```typescript
const config: MCPClientConfig = {
  mode: 'api-key',
  aiModel: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    apiKey: process.env.ANTHROPIC_API_KEY,
    maxTokens: 4096,
    temperature: 1.0,
  },
  sampling: {
    strategy: 'full',
    maxTokens: 1000,
  },
  servers: [],
};
```

**OpenAI (GPT-4, GPT-3.5)**
```typescript
const config: MCPClientConfig = {
  mode: 'api-key',
  aiModel: {
    provider: 'openai',
    model: 'gpt-4-turbo-preview',
    apiKey: process.env.OPENAI_API_KEY,
    maxTokens: 4096,
    temperature: 1.0,
  },
  sampling: {
    strategy: 'full',
    maxTokens: 1000,
  },
  servers: [],
};
```

**GitHub Models API (with GitHub token)**
```typescript
const config: MCPClientConfig = {
  mode: 'api-key',
  aiModel: {
    provider: 'github-copilot',
    model: 'gpt-4o',  // GitHub provides access to various models
    apiKey: process.env.GITHUB_TOKEN,  // GitHub Personal Access Token
    maxTokens: 4096,
    temperature: 1.0,
  },
  sampling: {
    strategy: 'full',
    maxTokens: 1000,
  },
  servers: [],
};
```

const client = new MCPClient(config);
await client.initialize();
```

#### GitHub/VS Code Mode
Free tier access through GitHub Copilot or VS Code integration (stub implementation).

```typescript
const config: MCPClientConfig = {
  mode: 'github-vscode',
  aiModel: {
    provider: 'github-copilot',
    model: 'gpt-4',
  },
  sampling: {
    strategy: 'chunked',
    maxTokens: 1000,
  },
  servers: [],
};
```

## Usage Examples

### Basic Setup

```typescript
import { MCPClient } from './mcp';
import type { MCPClientConfig } from '../shared/mcp-types';

// Configure the client
const config: MCPClientConfig = {
  mode: 'api-key',
  aiModel: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    apiKey: 'your-api-key',
  },
  sampling: {
    strategy: 'full',
    maxTokens: 1000,
  },
  servers: [],
};

// Initialize
const client = new MCPClient(config);
await client.initialize();
```

### Adding MCP Servers

```typescript
// Add a game-specific MCP server
await client.addServer({
  id: 'hollow-knight',
  name: 'Hollow Knight MCP',
  command: 'node',
  args: ['path/to/hollow-knight-mcp/dist/index.js'],
  enabled: true,
  metadata: {
    gameId: 'hollow-knight',
    description: 'MCP server for Hollow Knight game data',
  },
});

// Get all connected tools
const tools = client.getAllTools();
console.log('Available tools:', tools);
```

### Sending Chat Messages with Context

```typescript
import type { ChatMessage, RawContext } from '../shared/mcp-types';

// Prepare messages
const messages: ChatMessage[] = [
  {
    role: 'user',
    content: 'What should I do next in the game?',
    timestamp: new Date(),
  },
];

// Prepare raw context
const rawContext: RawContext = {
  savefile: {
    data: { health: 5, charms: ['dashmaster', 'quick_focus'] },
    sizeBytes: 200,
  },
  guide: {
    text: 'Game guide content...',
    sizeBytes: 1000,
  },
};

// Send chat request
const response = await client.chat(messages, rawContext);
console.log('AI response:', response);
```

### Invoking MCP Tools

```typescript
// Invoke a tool on an MCP server
const result = await client.invokeTool({
  serverId: 'hollow-knight',
  toolName: 'analyze_savefile',
  arguments: {
    path: '/path/to/savefile',
  },
});

console.log('Tool result:', result);
```

### Managing Server State

```typescript
// Subscribe to server state changes
const unsubscribe = client.onServerStateChange((states) => {
  for (const [serverId, state] of states) {
    console.log(`Server ${serverId}:`, state.status);
  }
});

// Get state of a specific server
const state = client.getServerState('hollow-knight');
if (state?.status === 'connected') {
  console.log('Tools available:', state.tools);
}

// Cleanup when done
unsubscribe();
```

## Context Sampling Strategies

### Full Strategy
Send all context within token limits.

```typescript
sampling: {
  strategy: 'full',
  maxTokens: 1000,
}
```

### Chunked Strategy
Split large content into chunks with overlap.

```typescript
sampling: {
  strategy: 'chunked',
  maxTokens: 1000,
  chunkSize: 500,
  overlap: 50,
}
```

### Summary Strategy
Create summaries of large content.

```typescript
sampling: {
  strategy: 'summary',
  maxTokens: 1000,
}
```

### Selective Strategy
Keep only important fields/sections.

```typescript
sampling: {
  strategy: 'selective',
  maxTokens: 1000,
}
```

### Priority Weights

Control how tokens are distributed among context types:

```typescript
sampling: {
  strategy: 'full',
  maxTokens: 1000,
  priority: {
    savefile: 3,    // 60% of tokens
    screenshot: 1,  // 20% of tokens
    guide: 1,       // 20% of tokens
  },
}
```

## API Reference

### MCPClient

Main client class.

**Methods:**
- `initialize(): Promise<void>` - Initialize the client
- `chat(messages, rawContext?): Promise<string>` - Send chat request
- `invokeTool(invocation): Promise<MCPToolResult>` - Invoke MCP tool
- `addServer(config): Promise<void>` - Add MCP server
- `removeServer(serverId): Promise<void>` - Remove MCP server
- `getAllTools(): Map<string, MCPTool[]>` - Get all tools
- `getAllResources(): Map<string, MCPResource[]>` - Get all resources
- `getServerStates(): Map<string, MCPConnectionState>` - Get all server states
- `onServerStateChange(listener): () => void` - Subscribe to state changes
- `updateAIConfig(config): Promise<void>` - Update AI configuration
- `updateSamplingConfig(config): void` - Update sampling configuration
- `cleanup(): Promise<void>` - Cleanup resources

### ContextSampler

Optimizes context data for AI models.

**Methods:**
- `sample(rawContext): Promise<SampledContext>` - Sample context
- `updateConfig(config): void` - Update configuration
- `getConfig(): ContextSamplingConfig` - Get configuration

### MCPConnectionManager

Manages multiple MCP server connections.

**Methods:**
- `addServer(config): Promise<void>` - Add server
- `removeServer(serverId): Promise<void>` - Remove server
- `connectServer(serverId): Promise<void>` - Connect to server
- `disconnectServer(serverId): Promise<void>` - Disconnect from server
- `invokeTool(invocation): Promise<MCPToolResult>` - Invoke tool
- `getAllTools(): Map<string, MCPTool[]>` - Get all tools
- `getAllResources(): Map<string, MCPResource[]>` - Get all resources
- `getStates(): Map<string, MCPConnectionState>` - Get states
- `onStateChange(listener): () => void` - Subscribe to changes
- `cleanup(): Promise<void>` - Cleanup

## Testing

Run unit tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Type Safety

All types are strongly typed with TypeScript. Avoid using `any` - use proper interfaces and types from `mcp-types.ts`.

## Dependencies

- `@modelcontextprotocol/sdk` - Official MCP SDK
- `@anthropic-ai/sdk` - Anthropic API client
- `vitest` - Testing framework (dev)

## License

AGPL-3.0 with commercial exception
