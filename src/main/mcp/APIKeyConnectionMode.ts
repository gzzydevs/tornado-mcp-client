// API Key connection mode implementation supporting multiple providers
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { AIConnectionMode, type AIResponse } from './AIConnectionMode';
import type { AIModelConfig, ChatMessage, SampledContext } from '../../shared/mcp-types';

/**
 * API Key based connection mode for direct model access
 * Supports multiple AI providers: Anthropic, OpenAI, and GitHub Models API
 */
export class APIKeyConnectionMode extends AIConnectionMode {
  private anthropicClient: Anthropic | null = null;
  private openaiClient: OpenAI | null = null;
  private connected: boolean = false;

  constructor(config: AIModelConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('API key is required for API key connection mode');
    }

    try {
      switch (this.config.provider) {
        case 'anthropic':
          this.anthropicClient = new Anthropic({
            apiKey: this.config.apiKey,
            baseURL: this.config.baseUrl,
          });
          break;
        
        case 'openai':
          this.openaiClient = new OpenAI({
            apiKey: this.config.apiKey,
            baseURL: this.config.baseUrl,
          });
          break;
        
        case 'github-copilot':
          // GitHub Models API uses OpenAI-compatible endpoints
          this.openaiClient = new OpenAI({
            apiKey: this.config.apiKey,
            baseURL: this.config.baseUrl || 'https://models.inference.ai.azure.com',
          });
          break;
        
        default:
          throw new Error(`Unsupported provider: ${this.config.provider}`);
      }
      
      this.connected = true;
      console.log(`API Key connection mode initialized successfully for ${this.config.provider}`);
    } catch (error) {
      this.connected = false;
      throw new Error(`Failed to initialize API key connection: ${error}`);
    }
  }

  async sendChatRequest(
    messages: ChatMessage[],
    context?: SampledContext
  ): Promise<AIResponse> {
    if (!this.connected) {
      throw new Error('Client not initialized. Call initialize() first.');
    }

    switch (this.config.provider) {
      case 'anthropic':
        return this.sendAnthropicRequest(messages, context);
      case 'openai':
      case 'github-copilot':
        return this.sendOpenAIRequest(messages, context);
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  private async sendAnthropicRequest(
    messages: ChatMessage[],
    context?: SampledContext
  ): Promise<AIResponse> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client not initialized');
    }

    try {
      // Build system message with context if available
      const systemMessage = this.buildSystemMessage(context);

      // Convert our message format to Anthropic format
      const anthropicMessages = messages.map(msg => ({
        role: msg.role === 'system' ? 'user' : msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      // Call Anthropic API
      const response = await this.anthropicClient.messages.create({
        model: this.config.model || 'claude-3-5-sonnet-20241022',
        max_tokens: this.config.maxTokens || 4096,
        temperature: this.config.temperature || 1.0,
        system: systemMessage,
        messages: anthropicMessages,
      });

      // Extract content from response
      const content = response.content
        .filter(block => block.type === 'text')
        .map(block => 'text' in block ? block.text : '')
        .join('\n');

      // Extract tool calls if any
      const toolCalls = response.content
        .filter(block => block.type === 'tool_use')
        .map(block => {
          if (block.type === 'tool_use') {
            return {
              serverId: 'default',
              toolName: block.name,
              arguments: block.input as Record<string, unknown>,
            };
          }
          return null;
        })
        .filter((call): call is NonNullable<typeof call> => call !== null);

      return {
        content,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        stopReason: response.stop_reason as AIResponse['stopReason'],
      };
    } catch (error) {
      console.error('Error sending Anthropic chat request:', error);
      throw new Error(`Failed to send chat request: ${error}`);
    }
  }

  private async sendOpenAIRequest(
    messages: ChatMessage[],
    context?: SampledContext
  ): Promise<AIResponse> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      // Build system message with context
      const systemMessage = this.buildSystemMessage(context);

      // Convert our message format to OpenAI format
      const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemMessage },
        ...messages.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        })),
      ];

      // Determine model based on provider
      let model = this.config.model;
      if (!model) {
        model = this.config.provider === 'github-copilot' 
          ? 'gpt-4o'  // GitHub Models default
          : 'gpt-4-turbo-preview';
      }

      // Call OpenAI API (works for both OpenAI and GitHub Models)
      const response = await this.openaiClient.chat.completions.create({
        model,
        messages: openaiMessages,
        max_tokens: this.config.maxTokens || 4096,
        temperature: this.config.temperature ?? 1.0,
      });

      const firstChoice = response.choices[0];
      const content = firstChoice.message.content || '';

      // Extract tool calls if any
      const toolCalls = firstChoice.message.tool_calls?.map(toolCall => ({
        serverId: 'default',
        toolName: toolCall.function.name,
        arguments: JSON.parse(toolCall.function.arguments) as Record<string, unknown>,
      }));

      return {
        content,
        toolCalls,
        stopReason: firstChoice.finish_reason === 'stop' ? 'end_turn' : 
                   firstChoice.finish_reason === 'length' ? 'max_tokens' :
                   firstChoice.finish_reason === 'tool_calls' ? 'tool_use' : 'end_turn',
      };
    } catch (error) {
      console.error('Error sending OpenAI chat request:', error);
      throw new Error(`Failed to send chat request: ${error}`);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async disconnect(): Promise<void> {
    this.anthropicClient = null;
    this.openaiClient = null;
    this.connected = false;
    console.log('API Key connection mode disconnected');
  }

  /**
   * Build system message with context information
   */
  private buildSystemMessage(context?: SampledContext): string {
    const parts: string[] = [
      'You are an AI assistant for game overlay support. You have access to game-specific tools and context.',
    ];

    if (!context) {
      return parts.join('\n\n');
    }

    if (context.savefile) {
      parts.push(
        '## Savefile Data',
        'Current game save information:',
        JSON.stringify(context.savefile.data, null, 2)
      );
    }

    if (context.screenshot) {
      parts.push(
        '## Screenshot',
        'A screenshot of the current game state is available for analysis.'
      );
    }

    if (context.guide && context.guide.chunks.length > 0) {
      parts.push(
        '## Game Guide',
        'Relevant guide sections:',
        context.guide.chunks.join('\n\n')
      );
    }

    parts.push(
      `\nTotal context tokens: ${context.totalTokens}`
    );

    return parts.join('\n\n');
  }
}
