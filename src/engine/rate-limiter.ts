const DEFAULT_DELAY_MS = 2000;

function getConfiguredDelay(): number {
  const val = process.env.BATCH_DELAY_MS;
  if (!val) return DEFAULT_DELAY_MS;
  const parsed = parseInt(val, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_DELAY_MS;
}

export async function delayBetweenBatchCalls(): Promise<void> {
  const ms = getConfiguredDelay();
  if (ms > 0) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }
}
