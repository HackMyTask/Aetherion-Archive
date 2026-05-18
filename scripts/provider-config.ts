import { BaseProvider } from '../src/ai/provider.js';
import { GeminiProvider } from '../src/ai/providers/gemini.js';
import { GroqProvider, OpenRouterProvider, OpenAICompatibleProvider } from '../src/ai/providers/openai-compatible.js';

export interface ProviderConfig {
  gemini?: { apiKey: string; model: string };
  groq?: { apiKey: string; model: string };
  openrouter?: { apiKey: string; model: string };
  openaiCompatible?: { apiKey: string; baseUrl: string; model: string };
}

export function loadProviderConfig(): ProviderConfig {
  return {
    gemini: process.env.GEMINI_API_KEY
      ? { apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash' }
      : undefined,
    groq: process.env.GROQ_API_KEY
      ? { apiKey: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile' }
      : undefined,
    openrouter: process.env.OPENROUTER_API_KEY
      ? { apiKey: process.env.OPENROUTER_API_KEY, model: process.env.OPENROUTER_MODEL ?? 'gpt-4o-mini' }
      : undefined,
    openaiCompatible: process.env.AI_API_KEY
      ? { apiKey: process.env.AI_API_KEY, baseUrl: process.env.AI_BASE_URL ?? 'https://api.openai.com/v1', model: process.env.AI_MODEL ?? 'gpt-4o-mini' }
      : undefined,
  };
}

export function createProviders(config: ProviderConfig): BaseProvider[] {
  const providers: BaseProvider[] = [];

  if (config.gemini) {
    providers.push(new GeminiProvider(config.gemini.apiKey, config.gemini.model));
  }
  if (config.groq) {
    providers.push(new GroqProvider(config.groq.apiKey, config.groq.model));
  }
  if (config.openrouter) {
    providers.push(new OpenRouterProvider(config.openrouter.apiKey, config.openrouter.model));
  }
  if (config.openaiCompatible) {
    providers.push(new OpenAICompatibleProvider(
      config.openaiCompatible.apiKey,
      config.openaiCompatible.baseUrl,
      config.openaiCompatible.model,
    ));
  }

  return providers;
}
