// Unit tests for MCPClient
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MCPClient } from './MCPClient';
import type { MCPClientConfig } from '../../shared/mcp-types';

describe('MCPClient', () => {
  let config: MCPClientConfig;
  let client: MCPClient;

  beforeEach(() => {
    config = {
      mode: 'api-key',
      aiModel: {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        apiKey: 'test-api-key',
        maxTokens: 4096,
        temperature: 1.0,
      },
      sampling: {
        strategy: 'full',
        maxTokens: 1000,
        priority: {
          savefile: 1,
          screenshot: 1,
          guide: 1,
        },
      },
      servers: [],
    };
    client = new MCPClient(config);
  });

  afterEach(async () => {
    await client.cleanup();
  });

  describe('constructor', () => {
    it('should create instance with config', () => {
      expect(client).toBeDefined();
      expect(client.getConfig()).toEqual(config);
    });
  });

  describe('initialize()', () => {
    it('should initialize successfully', async () => {
      await expect(client.initialize()).resolves.not.toThrow();
    });
  });

  describe('getConfig()', () => {
    it('should return current configuration', () => {
      const currentConfig = client.getConfig();
      expect(currentConfig).toEqual(config);
    });
  });

  describe('updateSamplingConfig()', () => {
    it('should update sampling configuration', async () => {
      await client.initialize();

      client.updateSamplingConfig({
        strategy: 'chunked',
        maxTokens: 2000,
      });

      const updatedConfig = client.getConfig();
      expect(updatedConfig.sampling.strategy).toBe('chunked');
      expect(updatedConfig.sampling.maxTokens).toBe(2000);
    });
  });

  describe('updateAIConfig()', () => {
    it('should update AI configuration and reconnect', async () => {
      await client.initialize();

      await client.updateAIConfig({
        temperature: 0.5,
        maxTokens: 2048,
      });

      const updatedConfig = client.getConfig();
      expect(updatedConfig.aiModel.temperature).toBe(0.5);
      expect(updatedConfig.aiModel.maxTokens).toBe(2048);
    });
  });

  describe('getServerStates()', () => {
    it('should return empty map when no servers added', () => {
      const states = client.getServerStates();
      expect(states.size).toBe(0);
    });
  });

  describe('getAllTools()', () => {
    it('should return empty map when no servers connected', () => {
      const tools = client.getAllTools();
      expect(tools.size).toBe(0);
    });
  });

  describe('getAllResources()', () => {
    it('should return empty map when no servers connected', () => {
      const resources = client.getAllResources();
      expect(resources.size).toBe(0);
    });
  });

  describe('cleanup()', () => {
    it('should cleanup resources', async () => {
      await client.initialize();
      await expect(client.cleanup()).resolves.not.toThrow();
    });
  });

  describe('mode switching', () => {
    it('should support github-vscode mode', () => {
      const githubConfig: MCPClientConfig = {
        ...config,
        mode: 'github-vscode',
        aiModel: {
          ...config.aiModel,
          provider: 'github-copilot',
          apiKey: undefined,
        },
      };

      const githubClient = new MCPClient(githubConfig);
      expect(githubClient).toBeDefined();
      expect(githubClient.getConfig().mode).toBe('github-vscode');
    });
  });
});
