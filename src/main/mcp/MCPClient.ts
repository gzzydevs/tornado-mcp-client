// Main MCP Client facade that integrates all components
import { MCPConnectionManager } from './MCPConnectionManager';
import { ContextSampler, type RawContext } from './ContextSampler';
import { AIConnectionMode } from './AIConnectionMode';
import { APIKeyConnectionMode } from './APIKeyConnectionMode';
import { GitHubVSCodeConnectionMode } from './GitHubVSCodeConnectionMode';
import type {
  MCPClientConfig,
  MCPServerConfig,
  MCPConnectionState,
  ChatMessage,
  SampledContext,
  MCPToolInvocation,
  MCPToolResult,
  MCPTool,
  MCPResource,
} from '../../shared/mcp-types';

/**
 * Main MCP Client that orchestrates all components
 * Provides a unified interface for:
 * - Managing MCP server connections
 * - Sampling context for AI models
 * - Sending chat requests with context
 * - Invoking MCP tools
 */
export class MCPClient {
  private connectionManager: MCPConnectionManager;
  private contextSampler: ContextSampler;
  private aiConnection: AIConnectionMode | null = null;
  private config: MCPClientConfig;

  constructor(config: MCPClientConfig) {
    this.config = config;
    this.connectionManager = new MCPConnectionManager();
    this.contextSampler = new ContextSampler(config.sampling);
  }

  /**
   * Initialize the MCP client
   * - Sets up AI connection based on mode
   * - Connects to configured MCP servers
   */
  async initialize(): Promise<void> {
    // Initialize AI connection based on mode
    this.aiConnection = this.createAIConnection();
    await this.aiConnection.initialize();

    // Add and connect to MCP servers
    for (const serverConfig of this.config.servers) {
      await this.connectionManager.addServer(serverConfig);
    }

    console.log('MCP Client initialized successfully');
  }

  /**
   * Send a chat message with optional context from MCP tools
   * @param messages - Chat history
   * @param rawContext - Optional raw context to be sampled
   * @returns AI response
   */
  async chat(messages: ChatMessage[], rawContext?: RawContext): Promise<string> {
    if (!this.aiConnection || !this.aiConnection.isConnected()) {
      throw new Error('AI connection not initialized');
    }

    // Sample context if provided
    let sampledContext: SampledContext | undefined;
    if (rawContext) {
      sampledContext = await this.contextSampler.sample(rawContext);
      console.log(`Context sampled: ${sampledContext.totalTokens} tokens`);
    }

    // Send chat request
    const response = await this.aiConnection.sendChatRequest(messages, sampledContext);

    // Handle tool calls if any
    if (response.toolCalls && response.toolCalls.length > 0) {
      console.log(`AI requested ${response.toolCalls.length} tool calls`);
      // TODO: Handle tool calls and continue conversation
      // For now, just return the content
    }

    return response.content;
  }

  /**
   * Invoke an MCP tool
   * @param invocation - Tool invocation details
   * @returns Tool result
   */
  async invokeTool(invocation: MCPToolInvocation): Promise<MCPToolResult> {
    return await this.connectionManager.invokeTool(invocation);
  }

  /**
   * Add a new MCP server
   * @param serverConfig - Server configuration
   */
  async addServer(serverConfig: MCPServerConfig): Promise<void> {
    await this.connectionManager.addServer(serverConfig);
    
    // Update config
    this.config.servers.push(serverConfig);
  }

  /**
   * Remove an MCP server
   * @param serverId - Server ID
   */
  async removeServer(serverId: string): Promise<void> {
    await this.connectionManager.removeServer(serverId);
    
    // Update config
    this.config.servers = this.config.servers.filter(s => s.id !== serverId);
  }

  /**
   * Get all available tools from connected servers
   * @returns Map of server ID to tools
   */
  getAllTools(): Map<string, MCPTool[]> {
    return this.connectionManager.getAllTools();
  }

  /**
   * Get all available resources from connected servers
   * @returns Map of server ID to resources
   */
  getAllResources(): Map<string, MCPResource[]> {
    return this.connectionManager.getAllResources();
  }

  /**
   * Get connection states for all servers
   * @returns Map of server ID to connection state
   */
  getServerStates(): Map<string, MCPConnectionState> {
    return this.connectionManager.getStates();
  }

  /**
   * Get connection state for a specific server
   * @param serverId - Server ID
   * @returns Connection state or undefined
   */
  getServerState(serverId: string): MCPConnectionState | undefined {
    return this.connectionManager.getState(serverId);
  }

  /**
   * Subscribe to server state changes
   * @param listener - Callback function
   * @returns Unsubscribe function
   */
  onServerStateChange(
    listener: (states: Map<string, MCPConnectionState>) => void
  ): () => void {
    return this.connectionManager.onStateChange(listener);
  }

  /**
   * Update AI model configuration
   * @param config - Partial AI model config
   */
  async updateAIConfig(config: Partial<MCPClientConfig['aiModel']>): Promise<void> {
    if (this.aiConnection) {
      await this.aiConnection.disconnect();
    }

    this.config.aiModel = { ...this.config.aiModel, ...config };
    this.aiConnection = this.createAIConnection();
    await this.aiConnection.initialize();
  }

  /**
   * Update sampling configuration
   * @param config - Partial sampling config
   */
  updateSamplingConfig(config: Partial<MCPClientConfig['sampling']>): void {
    this.config.sampling = { ...this.config.sampling, ...config };
    this.contextSampler.updateConfig(config);
  }

  /**
   * Get current configuration
   * @returns Current client configuration
   */
  getConfig(): MCPClientConfig {
    return { ...this.config };
  }

  /**
   * Cleanup and disconnect all resources
   */
  async cleanup(): Promise<void> {
    if (this.aiConnection) {
      await this.aiConnection.disconnect();
      this.aiConnection = null;
    }

    await this.connectionManager.cleanup();
    console.log('MCP Client cleaned up');
  }

  /**
   * Create AI connection based on configured mode
   */
  private createAIConnection(): AIConnectionMode {
    switch (this.config.mode) {
      case 'api-key':
        return new APIKeyConnectionMode(this.config.aiModel);
      case 'github-vscode':
        return new GitHubVSCodeConnectionMode(this.config.aiModel);
      default:
        throw new Error(`Unknown connection mode: ${this.config.mode}`);
    }
  }
}
