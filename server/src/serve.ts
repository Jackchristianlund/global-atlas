/**
 * Minimal caching API server over the snapshot store (no framework).
 *   GET /api/datasets              registry: metadata + latest retrieval info
 *   GET /api/datasets/:id/latest   latest snapshot envelope (ETag = sha256)
 *   GET /api/datasets/:id/history  list of stored versions
 */
import { createServer } from 'node:http';
import { SnapshotStore } from './store';
import type { DatasetMeta } from './types';

export function serve(store: SnapshotStore, metas: DatasetMeta[], port = 8787): ReturnType<typeof createServer> {
  const srv = createServer((req, res) => {
    const send = (code: number, body: unknown, headers: Record<string, string> = {}) => {
      const text = JSON.stringify(body);
      res.writeHead(code, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
        ...headers,
      });
      res.end(text);
    };
    const url = new URL(req.url ?? '/', 'http://localhost');
    const m = url.pathname.match(/^\/api\/datasets(?:\/([\w-]+)\/(latest|history))?\/?$/);
    if (!m) return send(404, { error: 'not found' });
    if (!m[1]) {
      return send(200, metas.map((meta) => ({ ...meta, latest: store.latest(meta.id)?.retrieved_at ?? null, versions: store.history(meta.id).length })));
    }
    const meta = metas.find((x) => x.id === m[1]);
    if (!meta) return send(404, { error: `unknown dataset ${m[1]}` });
    if (m[2] === 'history') return send(200, store.history(meta.id));
    const latest = store.latest(meta.id);
    if (!latest) return send(404, { error: `no snapshot for ${meta.id}; run the ingest first`, status: meta.status, blocked_reason: meta.blocked_reason ?? null });
    if (req.headers['if-none-match'] === latest.sha256) { res.writeHead(304, { ETag: latest.sha256 }); return res.end(); }
    return send(200, latest, { ETag: latest.sha256 });
  });
  srv.listen(port);
  return srv;
}
