/** "247 ms", or an em dash when there is no valid measurement. */
export function formatMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return '—';
  return `${Math.round(ms)} ms`;
}

export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined || !Number.isFinite(score)) return '—';
  return score < 0 ? `−${Math.abs(score).toLocaleString('en-US')}` : score.toLocaleString('en-US');
}

/** "+906", "−250" (true minus sign) or "0". */
export function formatSignedScore(score: number): string {
  if (score > 0) return `+${score.toLocaleString('en-US')}`;
  if (score < 0) return `−${Math.abs(score).toLocaleString('en-US')}`;
  return '0';
}
