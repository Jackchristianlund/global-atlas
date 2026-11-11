/** Fetch helper: timeout, one retry on network failure, polite User-Agent, no silent fallbacks. */

const UA = 'global-atlas-ingest/0.2 (research/educational; contact: see repository README)';

export async function getText(url: string, opts: { timeoutMs?: number; headers?: Record<string, string> } = {}): Promise<string> {
  const { timeoutMs = 120_000, headers = {} } = opts;
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: ctl.signal, headers: { 'User-Agent': UA, ...headers } });
      if (res.status === 429) throw new Error(`rate limited (429) by ${new URL(url).host} — respect Retry-After and re-run later`);
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
      return await res.text();
    } catch (e) {
      lastErr = e;
      if (attempt === 0) await new Promise((r) => setTimeout(r, 1500));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export async function getJson<T>(url: string, opts: Parameters<typeof getText>[1] = {}): Promise<T> {
  return JSON.parse(await getText(url, { ...opts, headers: { Accept: 'application/json', ...(opts.headers ?? {}) } })) as T;
}
