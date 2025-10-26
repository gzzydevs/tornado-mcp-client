// Unit tests for ContextSampler
import { describe, it, expect, beforeEach } from 'vitest';
import { ContextSampler, type RawContext } from './ContextSampler';
import type { ContextSamplingConfig } from '../../shared/mcp-types';

describe('ContextSampler', () => {
  let sampler: ContextSampler;
  let config: ContextSamplingConfig;

  beforeEach(() => {
    config = {
      strategy: 'full',
      maxTokens: 1000,
      priority: {
        savefile: 1,
        screenshot: 1,
        guide: 1,
      },
    };
    sampler = new ContextSampler(config);
  });

  describe('sample()', () => {
    it('should return empty context when no data provided', async () => {
      const rawContext: RawContext = {};
      const result = await sampler.sample(rawContext);

      expect(result.totalTokens).toBe(0);
      expect(result.savefile).toBeUndefined();
      expect(result.screenshot).toBeUndefined();
      expect(result.guide).toBeUndefined();
    });

    it('should sample savefile data within budget', async () => {
      const rawContext: RawContext = {
        savefile: {
          data: { health: 100, level: 5 },
          sizeBytes: 50,
        },
      };

      const result = await sampler.sample(rawContext);

      expect(result.savefile).toBeDefined();
      expect(result.savefile!.data).toBeDefined();
      expect(result.savefile!.tokens).toBeGreaterThan(0);
      expect(result.savefile!.tokens).toBeLessThanOrEqual(config.maxTokens);
    });

    it('should sample screenshot data', async () => {
      const rawContext: RawContext = {
        screenshot: {
          data: 'base64encodeddata',
          sizeBytes: 1000,
        },
      };

      // Set priority to screenshot only
      config.maxTokens = 2000;
      config.priority = {
        savefile: 0,
        screenshot: 1,
        guide: 0,
      };
      sampler = new ContextSampler(config);

      const result = await sampler.sample(rawContext);

      expect(result.screenshot).toBeDefined();
      expect(result.screenshot!.tokens).toBeGreaterThan(0);
    });

    it('should sample guide data with chunking strategy', async () => {
      const guideText = 'This is a game guide. '.repeat(100);
      const rawContext: RawContext = {
        guide: {
          text: guideText,
          sizeBytes: guideText.length,
        },
      };

      config.strategy = 'chunked';
      config.chunkSize = 100;
      config.overlap = 20;
      sampler = new ContextSampler(config);

      const result = await sampler.sample(rawContext);

      expect(result.guide).toBeDefined();
      expect(result.guide!.chunks).toBeDefined();
      expect(result.guide!.chunks.length).toBeGreaterThan(0);
      expect(result.guide!.tokens).toBeGreaterThan(0);
    });

    it('should respect priority weights', async () => {
      const rawContext: RawContext = {
        savefile: {
          data: { health: 100 },
          sizeBytes: 50,
        },
        guide: {
          text: 'Guide text',
          sizeBytes: 100,
        },
      };

      config.priority = {
        savefile: 3,
        screenshot: 1,
        guide: 1,
      };
      sampler = new ContextSampler(config);

      const result = await sampler.sample(rawContext);

      // Savefile should get more tokens than guide due to priority
      expect(result.savefile).toBeDefined();
      expect(result.guide).toBeDefined();
    });

    it('should not exceed max tokens', async () => {
      const largeData = 'x'.repeat(10000);
      const rawContext: RawContext = {
        savefile: {
          data: { data: largeData },
          sizeBytes: largeData.length,
        },
        guide: {
          text: largeData,
          sizeBytes: largeData.length,
        },
      };

      config.maxTokens = 100;
      sampler = new ContextSampler(config);

      const result = await sampler.sample(rawContext);

      expect(result.totalTokens).toBeLessThanOrEqual(config.maxTokens);
    });
  });

  describe('updateConfig()', () => {
    it('should update configuration', () => {
      const newConfig = {
        strategy: 'summary' as const,
        maxTokens: 2000,
      };

      sampler.updateConfig(newConfig);
      const currentConfig = sampler.getConfig();

      expect(currentConfig.strategy).toBe('summary');
      expect(currentConfig.maxTokens).toBe(2000);
    });
  });

  describe('getConfig()', () => {
    it('should return current configuration', () => {
      const currentConfig = sampler.getConfig();

      expect(currentConfig).toEqual(config);
    });
  });
});
