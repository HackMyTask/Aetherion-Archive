import * as path from 'node:path';
import { appendToJSONL, readAllJSONL } from './jsonl.js';
import { EntityType } from '../types/entity.js';

export interface SessionStatEntry {
  sessionId: string;
  timestamp: string;
  type: EntityType;
  entityId: string;
  provider: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
}

export interface RateCard {
  inputPer1K: number;
  outputPer1K: number;
}

const DEFAULT_RATES: Record<string, RateCard> = {
  'gpt-4': { inputPer1K: 0.03, outputPer1K: 0.06 },
  'gpt-4-turbo': { inputPer1K: 0.01, outputPer1K: 0.03 },
  'gpt-4o': { inputPer1K: 0.005, outputPer1K: 0.015 },
  'gpt-4o-mini': { inputPer1K: 0.00015, outputPer1K: 0.0006 },
  'claude-3-sonnet': { inputPer1K: 0.003, outputPer1K: 0.015 },
  'claude-3-haiku': { inputPer1K: 0.00025, outputPer1K: 0.00125 },
  'claude-opus': { inputPer1K: 0.015, outputPer1K: 0.075 },
};

function getRate(model: string): RateCard {
  const normalized = model.toLowerCase().replace(/[_-]/g, '-');
  const sorted = Object.entries(DEFAULT_RATES).sort((a, b) => b[0].length - a[0].length);
  for (const [key, rate] of sorted) {
    if (normalized.includes(key)) return rate;
  }
  return { inputPer1K: 0.002, outputPer1K: 0.01 };
}

export function estimateCost(tokensIn: number, tokensOut: number, model: string): number {
  const rate = getRate(model);
  return (tokensIn / 1000) * rate.inputPer1K + (tokensOut / 1000) * rate.outputPer1K;
}

export function sessionStatsPath(canonDir: string): string {
  return path.join(canonDir, 'session-stats.jsonl');
}

export async function appendSessionStat(canonDir: string, entry: SessionStatEntry): Promise<void> {
  await appendToJSONL(sessionStatsPath(canonDir), entry);
}

export async function readSessionStats(canonDir: string): Promise<SessionStatEntry[]> {
  return readAllJSONL<SessionStatEntry>(sessionStatsPath(canonDir));
}

export interface SessionSummary {
  totalSessions: number;
  totalEntries: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalCost: number;
  byProvider: Record<string, { tokensIn: number; tokensOut: number; cost: number; count: number }>;
  byType: Record<string, number>;
}

export function summarizeStats(entries: SessionStatEntry[]): SessionSummary {
  const byProvider: SessionSummary['byProvider'] = {};
  const byType: Record<string, number> = {};
  let totalTokensIn = 0;
  let totalTokensOut = 0;
  let totalCost = 0;

  for (const entry of entries) {
    totalTokensIn += entry.tokensIn;
    totalTokensOut += entry.tokensOut;
    const cost = estimateCost(entry.tokensIn, entry.tokensOut, entry.model);
    totalCost += cost;
    byType[entry.type] = (byType[entry.type] ?? 0) + 1;

    const providerKey = `${entry.provider}/${entry.model}`;
    if (!byProvider[providerKey]) {
      byProvider[providerKey] = { tokensIn: 0, tokensOut: 0, cost: 0, count: 0 };
    }
    byProvider[providerKey].tokensIn += entry.tokensIn;
    byProvider[providerKey].tokensOut += entry.tokensOut;
    byProvider[providerKey].cost += cost;
    byProvider[providerKey].count++;
  }

  const sessions = new Set(entries.map(e => e.sessionId));
  return { totalSessions: sessions.size, totalEntries: entries.length, totalTokensIn, totalTokensOut, totalCost, byProvider, byType };
}
