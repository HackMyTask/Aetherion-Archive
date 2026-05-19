import { AIRequest, AIResponse } from '../../types/ai.js';
import { BaseProvider, createAIResponse } from '../provider.js';

// Shared helper used by Groq, OpenRouter, and OpenAI-compatible
function buildChatPayload(request: AIRequest): unknown {
  return {
    model: request.model ?? 'gpt-4o-mini',
    messages: [
      { role: 'system', content: request.systemPrompt },
      { role: 'user', content: request.userPrompt },
    ],
    max_tokens: request.maxTokens ?? 4096,
    temperature: request.temperature ?? 0.7,
  };
}

function parseChatResponse(raw: unknown, provider: string, model: string, startTime: number): AIResponse {
  const data = raw as any;
  const choice = data?.choices?.[0];
  const text = choice?.message?.content ?? '';
  const usage = data?.usage ?? {};
  return createAIResponse(
    text,
    provider,
    model ?? 'unknown',
    usage?.prompt_tokens ?? 0,
    usage?.completion_tokens ?? 0,
    Date.now() - startTime,
    choice?.finish_reason === 'stop' ? 'stop' : choice?.finish_reason === 'length' ? 'length' : text ? 'stop' : 'error',
  );
}

export class OpenAICompatibleProvider extends BaseProvider {
  constructor(apiKey: string, baseUrl = process.env.AI_BASE_URL ?? 'https://api.openai.com/v1', model: string, id?: string, name?: string) {
    super(
      id ?? 'openai-compatible',
      name ?? 'OpenAI Compatible',
      apiKey,
      baseUrl,
      model,
    );
  }

  protected addAuthHeaders(headers: Record<string, string>): void {
    headers['Authorization'] = `Bearer ${this.apiKey}`;
  }

  protected formatRequest(request: AIRequest): unknown {
    return buildChatPayload(request);
  }

  protected parseResponse(raw: unknown, _request: AIRequest, startTime: number): AIResponse {
    return parseChatResponse(raw, this.id, this.defaultModel, startTime);
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const start = Date.now();
    const body = this.formatRequest({ ...request, model: request.model ?? this.defaultModel });
    const response = await this.post('/chat/completions', body);
    const data = await response.json();
    return this.parseResponse(data, request, start);
  }
}

export class GroqProvider extends OpenAICompatibleProvider {
  constructor(apiKey: string, model = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile', keyIndex?: number) {
    const suffix = keyIndex !== undefined && keyIndex > 0 ? `-${keyIndex + 1}` : '';
    super(
      apiKey, 'https://api.groq.com/openai/v1', model,
      keyIndex !== undefined && keyIndex > 0 ? `groq${suffix}` : 'groq',
      `Groq${suffix}`,
    );
  }
}

export class OpenRouterProvider extends OpenAICompatibleProvider {
  constructor(apiKey: string, model = process.env.OPENROUTER_MODEL ?? 'qwen/qwen3-235b-a22b') {
    super(apiKey, 'https://openrouter.ai/api/v1', model, 'openrouter', 'OpenRouter');
  }

  protected addAuthHeaders(headers: Record<string, string>): void {
    headers['Authorization'] = `Bearer ${this.apiKey}`;
    headers['HTTP-Referer'] = 'https://aetherion-archive.app';
    headers['X-Title'] = 'Aetherion Archive';
  }
}
