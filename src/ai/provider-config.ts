import { EntityType, entityTypeDir } from '../types/entity.js';

export type GenerationStrategy = 'cheap' | 'balanced' | 'quality';

const VALID_STRATEGIES: readonly string[] = ['cheap', 'balanced', 'quality'];

const DEFAULT_MODELS: Record<string, string> = {
  gemini: 'gemini-2.5-flash',
  groq: 'llama-3.3-70b-versatile',
  openrouter: 'qwen/qwen3-235b-a22b',
};

const STRATEGY_ORDER: Record<GenerationStrategy, string[]> = {
  cheap: ['groq', 'gemini', 'openrouter'],
  balanced: ['gemini', 'groq', 'openrouter'],
  quality: ['openrouter', 'gemini', 'groq'],
};

export function getModelForProvider(providerId: string): string {
  const key = providerId.replace(/-\d+$/, '');
  return process.env[`${key.toUpperCase()}_MODEL`] ?? DEFAULT_MODELS[key] ?? 'gemini-2.5-flash';
}

export function getGenerationStrategy(): GenerationStrategy {
  const val = process.env.GENERATION_STRATEGY;
  if (val && VALID_STRATEGIES.includes(val)) return val as GenerationStrategy;
  return 'balanced';
}

export function getModelForEntityType(type: EntityType): GenerationStrategy {
  const plural = entityTypeDir(type).toUpperCase();
  const override = process.env[`MODEL_FOR_${plural}`] as GenerationStrategy | undefined;
  if (override && VALID_STRATEGIES.includes(override)) return override;
  return getGenerationStrategy();
}

export function getProviderFallbackOrder(strategy: GenerationStrategy): string[] {
  return STRATEGY_ORDER[strategy];
}
