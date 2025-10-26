// MCP type definitions for Tornado MCP Client

/**
 * Represents a tool exposed by an MCP server
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Result from executing an MCP tool
 */
export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

/**
 * Resource exposed by an MCP server (e.g., savefile, screenshot, guide)
 */
export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

/**
 * MCP server information
 */
export interface MCPServerInfo {
  name: string;
  version: string;
  protocolVersion: string;
  capabilities: {
    tools?: Record<string, unknown>;
    resources?: Record<string, unknown>;
    prompts?: Record<string, unknown>;
  };
}

/**
 * Configuration for connecting to an MCP server
 */
export interface MCPServerConfig {
  id: string;
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  enabled: boolean;
  metadata?: {
    gameId?: string;
    description?: string;
    version?: string;
  };
}

/**
 * Status of an MCP server connection
 */
export type MCPConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Connection state for an MCP server
 */
export interface MCPConnectionState {
  serverId: string;
  status: MCPConnectionStatus;
  info?: MCPServerInfo;
  tools?: MCPTool[];
  resources?: MCPResource[];
  error?: string;
  lastConnected?: Date;
}

/**
 * Sampling strategy for context optimization
 */
export type SamplingStrategy = 'full' | 'chunked' | 'summary' | 'selective';

/**
 * Configuration for context sampling
 */
export interface ContextSamplingConfig {
  strategy: SamplingStrategy;
  maxTokens: number;
  chunkSize?: number;
  overlap?: number;
  priority?: {
    savefile: number;
    screenshot: number;
    guide: number;
  };
}

/**
 * Sampled context ready for sending to AI model
 */
export interface SampledContext {
  savefile?: {
    data: unknown;
    tokens: number;
  };
  screenshot?: {
    data: string; // base64
    tokens: number;
  };
  guide?: {
    chunks: string[];
    tokens: number;
  };
  totalTokens: number;
}

/**
 * AI model provider types
 */
export type AIProvider = 'anthropic' | 'openai' | 'local' | 'github-copilot';

/**
 * Configuration for AI model connection
 */
export interface AIModelConfig {
  provider: AIProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Connection mode for MCP client
 */
export type MCPConnectionMode = 'api-key' | 'github-vscode';

/**
 * Complete MCP client configuration
 */
export interface MCPClientConfig {
  mode: MCPConnectionMode;
  aiModel: AIModelConfig;
  sampling: ContextSamplingConfig;
  servers: MCPServerConfig[];
}

/**
 * Request to invoke an MCP tool
 */
export interface MCPToolInvocation {
  serverId: string;
  toolName: string;
  arguments: Record<string, unknown>;
}

/**
 * Chat message for AI interaction
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

/**
 * Chat session with context
 */
export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  context?: SampledContext;
  activeServerId?: string;
}
