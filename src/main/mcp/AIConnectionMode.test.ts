// Unit tests for AIConnectionMode implementations
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIKeyConnectionMode } from './APIKeyConnectionMode';
import { GitHubVSCodeConnectionMode } from './GitHubVSCodeConnectionMode';
import type { AIModelConfig, ChatMessage } from '../../shared/mcp-types';

describe('APIKeyConnectionMode', () => {
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

  describe('initialize()', () => {
    it('should throw error if no API key provided', async () => {
      const noKeyConfig = { ...config, apiKey: undefined };
      const noKeyConnection = new APIKeyConnectionMode(noKeyConfig);

      await expect(noKeyConnection.initialize()).rejects.toThrow(
        'API key is required'
      );
    });

    it('should initialize successfully with valid API key', async () => {
      await expect(connection.initialize()).resolves.not.toThrow();
      expect(connection.isConnected()).toBe(true);
    });
  });

  describe('getConfig() and updateConfig()', () => {
    it('should return current config', () => {
      const currentConfig = connection.getConfig();
      expect(currentConfig).toEqual(config);
    });

    it('should update config', () => {
      connection.updateConfig({ temperature: 0.5 });
      const updatedConfig = connection.getConfig();
      expect(updatedConfig.temperature).toBe(0.5);
    });
  });

  describe('isConnected()', () => {
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
