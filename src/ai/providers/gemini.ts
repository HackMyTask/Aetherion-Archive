import { AIRequest, AIResponse } from '../../types/ai.js';
import { BaseProvider, createAIResponse } from '../provider.js';

export class GeminiProvider extends BaseProvider {
  constructor(apiKey: string, model = 'gemini-2.0-flash') {
    super('gemini', 'Google Gemini', apiKey, 'https://generativelanguage.googleapis.com/v1beta', model);
  }

  protected addAuthHeaders(_headers: Record<string, string>): void {}

  protected formatRequest(request: AIRequest): unknown {
    return {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${request.systemPrompt}\n\n${request.userPrompt}` }],
        },
      ],
      generationConfig: {
        maxOutputTokens: request.maxTokens ?? 4096,
        temperature: request.temperature ?? 0.7,
      },
    };
  }

  protected parseResponse(raw: unknown, _request: AIRequest, startTime: number): AIResponse {
    const data = raw as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const usage = data?.usageMetadata ?? {};
    return createAIResponse(
      text,
      this.id,
      this.defaultModel,
      usage?.promptTokenCount ?? 0,
      usage?.candidatesTokenCount ?? 0,
      Date.now() - startTime,
      text ? 'stop' : 'error',
    );
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const start = Date.now();
    const model = request.model ?? this.defaultModel;
    const body = this.formatRequest(request);
    const response = await this.post(`/models/${model}:generateContent?key=${this.apiKey}`, body);
    const data = await response.json();
    return this.parseResponse(data, request, start);
  }
}
