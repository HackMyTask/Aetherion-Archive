import { AIRequest, AIResponse } from '../types/ai.js';

export abstract class BaseProvider {
  readonly id: string;
  readonly name: string;
  protected apiKey: string;
  protected baseUrl: string;
  protected defaultModel: string;

  constructor(id: string, name: string, apiKey: string, baseUrl: string, defaultModel: string) {
    this.id = id;
    this.name = name;
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.defaultModel = defaultModel;
  }

  abstract generate(request: AIRequest): Promise<AIResponse>;

  isAvailable(): boolean {
    return this.apiKey.length > 0;
  }

  protected abstract formatRequest(request: AIRequest): unknown;

  protected abstract parseResponse(raw: unknown, request: AIRequest, startTime: number): AIResponse;

  protected async post(path: string, body: unknown): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    this.addAuthHeaders(headers);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`[${this.id}] HTTP ${response.status}: ${text.slice(0, 200)}`);
    }
    return response;
  }

  protected abstract addAuthHeaders(headers: Record<string, string>): void;
}

export function createAIResponse(
  content: string,
  provider: string,
  model: string,
  tokensIn: number,
  tokensOut: number,
  latencyMs: number,
  finishReason: 'stop' | 'length' | 'error',
): AIResponse {
  return { content, provider, model, tokensIn, tokensOut, latencyMs, finishReason };
}
