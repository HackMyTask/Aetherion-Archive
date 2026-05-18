export interface AIRequest {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  finishReason: 'stop' | 'length' | 'error';
}

export interface AIProviderConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
}

export interface ProviderEntry {
  provider: AIProvider;
  priority: number;
}

export interface AIProvider {
  readonly id: string;
  readonly name: string;
  generate(request: AIRequest): Promise<AIResponse>;
  isAvailable(): boolean;
}
