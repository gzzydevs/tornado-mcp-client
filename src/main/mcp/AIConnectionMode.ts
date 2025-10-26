// Abstract base class for MCP connection modes
import type { 
  AIModelConfig, 
  ChatMessage, 
  MCPToolInvocation, 
  MCPToolResult,
  SampledContext 
} from '../../shared/mcp-types';

/**
 * Response from AI model after processing a chat request
 */
export interface AIResponse {
  content: string;
  toolCalls?: MCPToolInvocation[];
  stopReason?: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use';
}

/**
 * Abstract base class for AI model connection modes
 * Defines the interface that all connection modes must implement
 */
export abstract class AIConnectionMode {
  protected config: AIModelConfig;

  constructor(config: AIModelConfig) {
    this.config = config;
  }

  /**
   * Initialize the connection to the AI model
   */
  abstract initialize(): Promise<void>;

  /**
   * Send a chat request to the AI model with optional context
   * @param messages - Array of chat messages
   * @param context - Optional sampled context from MCP tools
   * @returns AI response with content and potential tool calls
   */
  abstract sendChatRequest(
    messages: ChatMessage[], 
    context?: SampledContext
  ): Promise<AIResponse>;

  /**
   * Check if the connection is currently active
   */
  abstract isConnected(): boolean;

  /**
   * Disconnect from the AI model
   */
  abstract disconnect(): Promise<void>;

  /**
   * Get the current configuration
   */
  getConfig(): AIModelConfig {
    return { ...this.config };
  }

  /**
   * Update the configuration
   */
  updateConfig(config: Partial<AIModelConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
