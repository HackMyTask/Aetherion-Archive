import { BaseProvider } from '../src/ai/provider.js';
import { GeminiProvider } from '../src/ai/providers/gemini.js';
import { GroqProvider, OpenRouterProvider, OpenAICompatibleProvider } from '../src/ai/providers/openai-compatible.js';

const MAX_KEYS_PER_PROVIDER = 20;

export interface ProviderEntry {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface ProviderConfig {
  gemini: ProviderEntry[];
  groq: ProviderEntry[];
  openrouter: ProviderEntry[];
  openaiCompatible: ProviderEntry[];
}

function loadEnvironmentKeys(prefix: string): string[] {
  const keys: string[] = [];
  const primary = process.env[prefix];
  if (primary) keys.push(primary);
  for (let i = 1; i <= MAX_KEYS_PER_PROVIDER; i++) {
    const key = process.env[`${prefix}_${i}`];
    if (key) keys.push(key);
  }
  return keys;
}

export function loadProviderConfig(): ProviderConfig {
  return {
    gemini: loadEnvironmentKeys('GEMINI_API_KEY').map(key => ({
      apiKey: key,
      model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
    })),
    groq: loadEnvironmentKeys('GROQ_API_KEY').map(key => ({
      apiKey: key,
      model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
    })),
    openrouter: loadEnvironmentKeys('OPENROUTER_API_KEY').map(key => ({
      apiKey: key,
      model: process.env.OPENROUTER_MODEL ?? 'gpt-4o-mini',
    })),
    openaiCompatible: loadEnvironmentKeys('AI_API_KEY').map(key => ({
      apiKey: key,
      model: process.env.AI_MODEL ?? 'gpt-4o-mini',
      baseUrl: process.env.AI_BASE_URL ?? 'https://api.openai.com/v1',
    })),
  };
}

export function createProviders(config: ProviderConfig): BaseProvider[] {
  const providers: BaseProvider[] = [];

  config.gemini.forEach((entry, i) => {
    providers.push(new GeminiProvider(entry.apiKey, entry.model, i));
  });
  config.groq.forEach((entry, i) => {
    providers.push(new GroqProvider(entry.apiKey, entry.model, i));
  });
  config.openrouter.forEach((entry) => {
    providers.push(new OpenRouterProvider(entry.apiKey, entry.model));
  });
  config.openaiCompatible.forEach((entry, i) => {
    const suffix = config.openaiCompatible.length > 1 ? `-${i + 1}` : '';
    const label = `OpenAI Compatible${suffix}`;
    const id = `openai-compatible${suffix}`;
    providers.push(new OpenAICompatibleProvider(entry.apiKey, entry.baseUrl!, entry.model, id, label));
  });

  return providers;
}
