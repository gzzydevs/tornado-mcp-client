// Unit tests for AIConnectionMode implementations
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIKeyConnectionMode } from './APIKeyConnectionMode';
import { GitHubVSCodeConnectionMode } from './GitHubVSCodeConnectionMode';
import type { AIModelConfig, ChatMessage } from '../../shared/mcp-types';

describe('APIKeyConnectionMode', () => {
  describe('Anthropic provider', () => {
    let config: AIModelConfig;
    let connection: APIKeyConnectionMode;

    beforeEach(() => {
      config = {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        apiKey: 'test-api-key',
        maxTokens: 4096,
        temperature: 1.0,
      };
      connection = new APIKeyConnectionMode(config);
    });

    it('should initialize successfully with Anthropic', async () => {
      await expect(connection.initialize()).resolves.not.toThrow();
      expect(connection.isConnected()).toBe(true);
    });
  });

  describe('OpenAI provider', () => {
    let config: AIModelConfig;
    let connection: APIKeyConnectionMode;

    beforeEach(() => {
      config = {
        provider: 'openai',
        model: 'gpt-4-turbo-preview',
        apiKey: 'test-api-key',
        maxTokens: 4096,
        temperature: 1.0,
      };
      connection = new APIKeyConnectionMode(config);
    });

    it('should initialize successfully with OpenAI', async () => {
      await expect(connection.initialize()).resolves.not.toThrow();
      expect(connection.isConnected()).toBe(true);
    });
  });

  describe('GitHub Copilot provider', () => {
    let config: AIModelConfig;
    let connection: APIKeyConnectionMode;

    beforeEach(() => {
      config = {
        provider: 'github-copilot',
        model: 'gpt-4o',
        apiKey: 'test-github-token',
        maxTokens: 4096,
        temperature: 1.0,
      };
      connection = new APIKeyConnectionMode(config);
    });

    it('should initialize successfully with GitHub Copilot', async () => {
      await expect(connection.initialize()).resolves.not.toThrow();
      expect(connection.isConnected()).toBe(true);
    });
  });

  describe('Common functionality', () => {
    let config: AIModelConfig;
    let connection: APIKeyConnectionMode;

    beforeEach(() => {
      config = {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        apiKey: 'test-api-key',
        maxTokens: 4096,
        temperature: 1.0,
      };
      connection = new APIKeyConnectionMode(config);
    });

    it('should throw error if no API key provided', async () => {
      const noKeyConfig = { ...config, apiKey: undefined };
      const noKeyConnection = new APIKeyConnectionMode(noKeyConfig);

      await expect(noKeyConnection.initialize()).rejects.toThrow(
        'API key is required'
      );
    });

    it('should return current config', () => {
      const currentConfig = connection.getConfig();
      expect(currentConfig).toEqual(config);
    });

    it('should update config', () => {
      connection.updateConfig({ temperature: 0.5 });
      const updatedConfig = connection.getConfig();
      expect(updatedConfig.temperature).toBe(0.5);
    });

    it('should return false before initialization', () => {
      expect(connection.isConnected()).toBe(false);
    });

    it('should return true after initialization', async () => {
      await connection.initialize();
      expect(connection.isConnected()).toBe(true);
    });

    it('should return false after disconnect', async () => {
      await connection.initialize();
      await connection.disconnect();
      expect(connection.isConnected()).toBe(false);
    });
  });
});

describe('GitHubVSCodeConnectionMode', () => {
  let config: AIModelConfig;
  let connection: GitHubVSCodeConnectionMode;

  beforeEach(() => {
    config = {
      provider: 'github-copilot',
      model: 'gpt-4',
    };
    connection = new GitHubVSCodeConnectionMode(config);
  });

  describe('initialize()', () => {
    it('should initialize successfully (stub)', async () => {
      await expect(connection.initialize()).resolves.not.toThrow();
      expect(connection.isConnected()).toBe(true);
    });
  });

  describe('sendChatRequest()', () => {
    it('should return stub response', async () => {
      await connection.initialize();

      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello', timestamp: new Date() },
      ];

      const response = await connection.sendChatRequest(messages);

      expect(response).toBeDefined();
      expect(response.content).toContain('stub');
    });
  });

  describe('isConnected()', () => {
    it('should return connection status', async () => {
      expect(connection.isConnected()).toBe(false);
      await connection.initialize();
      expect(connection.isConnected()).toBe(true);
    });
  });

  describe('disconnect()', () => {
    it('should disconnect successfully', async () => {
      await connection.initialize();
      await connection.disconnect();
      expect(connection.isConnected()).toBe(false);
    });
  });
});
