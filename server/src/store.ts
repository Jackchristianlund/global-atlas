/**
 * Versioned snapshot store on disk.
 *   server/data/<dataset>/<timestamp>__<sha8>.json   (history, append-only)
 *   server/data/<dataset>/latest.json                (pointer copy)
 * Identical content (same sha256) is not stored twice; the history thus records
 * every actual change with its retrieval timestamp.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { DatasetMeta, SnapshotEnvelope } from './types';

export class SnapshotStore {
  constructor(private root: string) {}

  private dir(id: string): string {
    const d = join(this.root, id);
    mkdirSync(d, { recursive: true });
    return d;
  }

  sha(records: unknown): string {
    return createHash('sha256').update(JSON.stringify(records)).digest('hex');
  }

  envelope<T>(meta: DatasetMeta, records: T[], unmapped?: string[]): SnapshotEnvelope<T> {
    return {
      dataset: meta,
      retrieved_at: new Date().toISOString(),
      sha256: this.sha(records),
      record_count: records.length,
      records,
      ...(unmapped && unmapped.length ? { unmapped_entities: unmapped } : {}),
    };
  }

  /** Returns 'new' | 'unchanged' | 'meta_updated'. */
  save<T>(env: SnapshotEnvelope<T>): 'new' | 'unchanged' | 'meta_updated' {
    const dir = this.dir(env.dataset.id);
    const latest = this.latest<T>(env.dataset.id);
    if (latest && latest.sha256 === env.sha256) {
      // Same records: no new version, but refresh the descriptive metadata so
      // corrections to licence/coverage notes reach the published extracts.
      if (JSON.stringify(latest.dataset) !== JSON.stringify(env.dataset)) {
        writeFileSync(join(dir, 'latest.json'), JSON.stringify({ ...latest, dataset: env.dataset }));
        return 'meta_updated';
      }
      return 'unchanged';
    }
    const stamp = env.retrieved_at.replace(/[:]/g, '-');
    const file = join(dir, `${stamp}__${env.sha256.slice(0, 8)}.json`);
    writeFileSync(file, JSON.stringify(env));
    writeFileSync(join(dir, 'latest.json'), JSON.stringify(env));
    return 'new';
  }

  latest<T>(id: string): SnapshotEnvelope<T> | null {
    const f = join(this.root, id, 'latest.json');
    if (!existsSync(f)) return null;
    return JSON.parse(readFileSync(f, 'utf-8')) as SnapshotEnvelope<T>;
  }

  history(id: string): { file: string; retrieved_at: string; sha8: string }[] {
    const d = join(this.root, id);
    if (!existsSync(d)) return [];
    return readdirSync(d)
      .filter((f) => f.includes('__'))
      .sort()
      .map((f) => ({ file: f, retrieved_at: f.split('__')[0].replace(/-(\d{2})-(\d{2}\.\d{3}Z)$/, ':$1:$2'), sha8: f.split('__')[1].replace('.json', '') }));
  }

  ids(): string[] {
    if (!existsSync(this.root)) return [];
    return readdirSync(this.root, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
  }
}
