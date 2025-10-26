// Context sampling system for optimizing data sent to AI models
import type { ContextSamplingConfig, SampledContext } from '../../shared/mcp-types';

/**
 * Raw context data before sampling
 */
export interface RawContext {
  savefile?: {
    data: unknown;
    sizeBytes: number;
  };
  screenshot?: {
    data: string; // base64
    sizeBytes: number;
  };
  guide?: {
    text: string;
    sizeBytes: number;
  };
}

/**
 * Context sampler for optimizing context sent to AI models
 * Implements various sampling strategies to stay within token limits
 */
export class ContextSampler {
  private config: ContextSamplingConfig;
  
  // Rough estimation: 1 token ≈ 4 characters
  private readonly CHARS_PER_TOKEN = 4;

  constructor(config: ContextSamplingConfig) {
    this.config = config;
  }

  /**
   * Sample raw context data according to the configured strategy
   * @param rawContext - Raw context data from MCP tools
   * @returns Sampled context optimized for token limits
   */
  async sample(rawContext: RawContext): Promise<SampledContext> {
    const sampled: SampledContext = {
      totalTokens: 0,
    };

    // Get priority weights (default to equal priority)
    const priority = this.config.priority || {
      savefile: 1,
      screenshot: 1,
      guide: 1,
    };

    const totalPriority = priority.savefile + priority.screenshot + priority.guide;
    
    // Calculate token budget for each context type
    const tokenBudget = {
      savefile: Math.floor((this.config.maxTokens * priority.savefile) / totalPriority),
      screenshot: Math.floor((this.config.maxTokens * priority.screenshot) / totalPriority),
      guide: Math.floor((this.config.maxTokens * priority.guide) / totalPriority),
    };

    // Sample each context type
    if (rawContext.savefile) {
      sampled.savefile = await this.sampleSavefile(
        rawContext.savefile,
        tokenBudget.savefile
      );
      sampled.totalTokens += sampled.savefile.tokens;
    }

    if (rawContext.screenshot) {
      sampled.screenshot = await this.sampleScreenshot(
        rawContext.screenshot,
        tokenBudget.screenshot
      );
      sampled.totalTokens += sampled.screenshot.tokens;
    }

    if (rawContext.guide) {
      sampled.guide = await this.sampleGuide(
        rawContext.guide,
        tokenBudget.guide
      );
      sampled.totalTokens += sampled.guide.tokens;
    }

    return sampled;
  }

  /**
   * Sample savefile data
   */
  private async sampleSavefile(
    savefile: { data: unknown; sizeBytes: number },
    maxTokens: number
  ): Promise<{ data: unknown; tokens: number }> {
    const jsonStr = JSON.stringify(savefile.data, null, 2);
    const estimatedTokens = Math.ceil(jsonStr.length / this.CHARS_PER_TOKEN);

    if (estimatedTokens <= maxTokens) {
      // Fits within budget, return as-is
      return {
        data: savefile.data,
        tokens: estimatedTokens,
      };
    }

    // Need to reduce savefile data
    switch (this.config.strategy) {
      case 'summary':
        return this.summarizeSavefile(savefile.data, maxTokens);
      case 'selective':
        return this.selectiveSavefile(savefile.data, maxTokens);
      default:
        // Truncate JSON string
        const maxChars = maxTokens * this.CHARS_PER_TOKEN;
        const truncated = jsonStr.substring(0, maxChars) + '\n... (truncated)';
        return {
          data: truncated,
          tokens: maxTokens,
        };
    }
  }

  /**
   * Sample screenshot data
   */
  private async sampleScreenshot(
    screenshot: { data: string; sizeBytes: number },
    maxTokens: number
  ): Promise<{ data: string; tokens: number }> {
    // For screenshots, we typically send the full image or none
    // Image tokens are calculated differently by the model
    // Estimate based on image size (rough approximation: 1 token per 750 bytes for images)
    const imageTokens = Math.ceil(screenshot.sizeBytes / 750);

    if (imageTokens <= maxTokens) {
      return {
        data: screenshot.data,
        tokens: imageTokens,
      };
    }

    // If screenshot exceeds budget, skip it
    return {
      data: '',
      tokens: 0,
    };
  }

  /**
   * Sample guide data using chunking
   */
  private async sampleGuide(
    guide: { text: string; sizeBytes: number },
    maxTokens: number
  ): Promise<{ chunks: string[]; tokens: number }> {
    const text = guide.text;
    const estimatedTokens = Math.ceil(text.length / this.CHARS_PER_TOKEN);

    if (estimatedTokens <= maxTokens) {
      // Fits within budget, return as single chunk
      return {
        chunks: [text],
        tokens: estimatedTokens,
      };
    }

    // Need to chunk the guide
    switch (this.config.strategy) {
      case 'chunked':
        return this.chunkGuide(text, maxTokens);
      case 'summary':
        return this.summarizeGuide(text, maxTokens);
      case 'selective':
        return this.selectiveGuide(text, maxTokens);
      default:
        // Simple truncation
        const maxChars = maxTokens * this.CHARS_PER_TOKEN;
        return {
          chunks: [text.substring(0, maxChars) + '\n... (truncated)'],
          tokens: maxTokens,
        };
    }
  }

  /**
   * Chunk guide text with overlap
   */
  private chunkGuide(text: string, maxTokens: number): { chunks: string[]; tokens: number } {
    const chunkSize = this.config.chunkSize || 500;
    const overlap = this.config.overlap || 50;
    const chunks: string[] = [];
    
    const maxChars = maxTokens * this.CHARS_PER_TOKEN;
    let currentChars = 0;
    let startIdx = 0;

    while (startIdx < text.length && currentChars < maxChars) {
      const endIdx = Math.min(startIdx + chunkSize, text.length);
      const chunk = text.substring(startIdx, endIdx);
      chunks.push(chunk);
      currentChars += chunk.length;
      
      // Move to next chunk with overlap
      startIdx = endIdx - overlap;
      
      if (startIdx >= text.length) break;
    }

    const totalTokens = Math.ceil(currentChars / this.CHARS_PER_TOKEN);
    return { chunks, tokens: totalTokens };
  }

  /**
   * Summarize savefile data (simple implementation)
   */
  private summarizeSavefile(data: unknown, maxTokens: number): { data: unknown; tokens: number } {
    // Simple summarization: keep top-level keys only
    if (typeof data !== 'object' || data === null) {
      return { data, tokens: 10 };
    }

    const summary = Object.keys(data).reduce((acc, key) => {
      acc[key] = '<data>';
      return acc;
    }, {} as Record<string, string>);

    const summaryStr = JSON.stringify(summary, null, 2);
    const tokens = Math.ceil(summaryStr.length / this.CHARS_PER_TOKEN);
    
    return { data: summary, tokens };
  }

  /**
   * Selective savefile sampling (keep important fields)
   */
  private selectiveSavefile(data: unknown, maxTokens: number): { data: unknown; tokens: number } {
    // Keep commonly important fields
    const importantFields = ['health', 'position', 'inventory', 'level', 'stats', 'progress'];
    
    if (typeof data !== 'object' || data === null) {
      return { data, tokens: 10 };
    }

    const filtered = Object.entries(data).reduce((acc, [key, value]) => {
      if (importantFields.includes(key.toLowerCase())) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);

    const filteredStr = JSON.stringify(filtered, null, 2);
    const tokens = Math.ceil(filteredStr.length / this.CHARS_PER_TOKEN);
    
    return { data: filtered, tokens };
  }

  /**
   * Summarize guide text
   */
  private summarizeGuide(text: string, maxTokens: number): { chunks: string[]; tokens: number } {
    // Simple summarization: take first N paragraphs
    const paragraphs = text.split('\n\n');
    const maxChars = maxTokens * this.CHARS_PER_TOKEN;
    const summary: string[] = [];
    let currentChars = 0;

    for (const para of paragraphs) {
      if (currentChars + para.length > maxChars) break;
      summary.push(para);
      currentChars += para.length;
    }

    const tokens = Math.ceil(currentChars / this.CHARS_PER_TOKEN);
    return { chunks: summary, tokens };
  }

  /**
   * Selective guide sampling (extract relevant sections)
   */
  private selectiveGuide(text: string, maxTokens: number): { chunks: string[]; tokens: number } {
    // Look for sections with headers or important keywords
    const sections = text.split(/\n#{1,6}\s+/);
    const maxChars = maxTokens * this.CHARS_PER_TOKEN;
    const selected: string[] = [];
    let currentChars = 0;

    for (const section of sections) {
      if (currentChars + section.length > maxChars) break;
      selected.push(section.trim());
      currentChars += section.length;
    }

    const tokens = Math.ceil(currentChars / this.CHARS_PER_TOKEN);
    return { chunks: selected, tokens };
  }

  /**
   * Update sampling configuration
   */
  updateConfig(config: Partial<ContextSamplingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): ContextSamplingConfig {
    return { ...this.config };
  }
}
