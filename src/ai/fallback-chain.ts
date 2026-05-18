import { AIRequest, AIResponse, ProviderEntry } from '../types/ai.js';

export interface FallbackResult {
  response: AIResponse | null;
  attempts: AttemptRecord[];
}

export interface AttemptRecord {
  providerId: string;
  providerName: string;
  success: boolean;
  latencyMs: number;
  error?: string;
  tokensIn?: number;
  tokensOut?: number;
}

export class FallbackChain {
  private providers: ProviderEntry[] = [];

  add(provider: ProviderEntry['provider'], priority: number): void {
    this.providers.push({ provider, priority });
    this.providers.sort((a, b) => a.priority - b.priority);
  }

  setProviders(entries: ProviderEntry[]): void {
    this.providers = [...entries].sort((a, b) => a.priority - b.priority);
  }

  getProviders(): ProviderEntry[] {
    return [...this.providers];
  }

  async execute(request: AIRequest): Promise<FallbackResult> {
    const attempts: AttemptRecord[] = [];

    for (const { provider } of this.providers) {
      if (!provider.isAvailable()) {
        attempts.push({
          providerId: provider.id,
          providerName: provider.name,
          success: false,
          latencyMs: 0,
          error: 'Provider not available (no API key)',
        });
        continue;
      }

      const start = Date.now();
      try {
        const response = await provider.generate(request);
        const latency = Date.now() - start;
        attempts.push({
          providerId: provider.id,
          providerName: provider.name,
          success: true,
          latencyMs: latency,
          tokensIn: response.tokensIn,
          tokensOut: response.tokensOut,
        });
        return { response, attempts };
      } catch (err) {
        const latency = Date.now() - start;
        const message = err instanceof Error ? err.message : String(err);
        attempts.push({
          providerId: provider.id,
          providerName: provider.name,
          success: false,
          latencyMs: latency,
          error: message,
        });
        console.warn(`[FallbackChain] ${provider.name} failed: ${message}`);
      }
    }

    return { response: null, attempts };
  }

  async executeWithRetry(request: AIRequest, maxRetries = 1): Promise<FallbackResult> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const result = await this.execute(request);
      if (result.response || attempt >= maxRetries) {
        return result;
      }
      const delay = Math.min(1000 * 2 ** attempt, 10_000);
      await new Promise(r => setTimeout(r, delay));
    }
    return { response: null, attempts: [] };
  }
}
