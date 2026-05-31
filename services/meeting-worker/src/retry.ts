/**
 * Retry an async operation with exponential backoff.
 * Used for the external calls inside a single /process run (embed, Qdrant, LLM)
 * so a transient blip doesn't fail the whole job. The cron sweep is the
 * higher-level backstop across runs.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { attempts?: number; baseDelayMs?: number; label?: string } = {}
): Promise<T> {
  const attempts = opts.attempts ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 500;
  let lastErr: unknown;

  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const isLast = i === attempts;
      console.warn(
        `[retry]${opts.label ? ` ${opts.label}` : ""} attempt ${i}/${attempts} failed${
          isLast ? " (giving up)" : ""
        }:`,
        err instanceof Error ? err.message : err
      );
      if (isLast) break;
      const delay = baseDelayMs * 2 ** (i - 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
