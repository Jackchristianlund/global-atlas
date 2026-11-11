/**
 * CLI:
 *   npx tsx server/src/cli.ts ingest [id…]   fetch + snapshot (default: all)
 *   npx tsx server/src/cli.ts publish        write frontend extracts + registry
 *   npx tsx server/src/cli.ts serve [port]   run the API server
 *   npx tsx server/src/cli.ts status         table of connectors and snapshots
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SnapshotStore } from './store';
import { makeOwidConnectors } from './connectors/owid';
import { acled, comtrade, portWatch, ucdpGed, unhcrFlows, unhcrPopulation, worldBank } from './connectors/apis';
import { publishEvents, publishLive, publishRegistry } from './publish';
import { serve } from './serve';
import type { Connector } from './types';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const store = new SnapshotStore(join(root, 'data'));
const owid = makeOwidConnectors(store);

const connectors: Connector<never>[] = [
  owid.ucdpCountryDeaths, owid.sipriMilex, owid.prioRegionDeaths, owid.prioRegionCounts, owid.energy,
  ucdpGed(store), acled(store), unhcrPopulation(store), unhcrFlows(store), worldBank(store), portWatch(store), comtrade(store),
] as Connector<never>[];

const liveDir = join(root, '..', 'src', 'data', 'live');
const publicDir = join(root, '..', 'public', 'data');

async function main() {
  const [cmd = 'status', ...args] = process.argv.slice(2);
  if (cmd === 'ingest') {
    const ids = args.length ? args : connectors.map((c) => c.meta.id);
    for (const c of connectors) {
      if (!ids.includes(c.meta.id)) continue;
      process.stdout.write(`${c.meta.id.padEnd(22)} … `);
      const t0 = Date.now();
      const r = await c.fetch();
      if (r.ok && r.envelope) {
        const un = r.envelope.unmapped_entities?.length ? ` unmapped:${r.envelope.unmapped_entities.length}` : '';
        console.log(`OK ${r.envelope.record_count} records in ${((Date.now() - t0) / 1000).toFixed(1)}s${un}`);
      } else {
        console.log(`FAILED: ${r.error}`);
      }
    }
    const out = publishLive(store, liveDir);
    publishRegistry(store, connectors.map((c) => c.meta), liveDir);
    const ev = publishEvents(store, publicDir);
    console.log(`published: ${out.written.join(', ') || '(none)'}${out.skipped.length ? ` | no snapshot yet: ${out.skipped.join(', ')}` : ''}`);
    console.log(ev.ingested ? `incident layer: ${ev.count} UCDP GED events` : 'incident layer: no UCDP GED snapshot, wrote the empty file');
  } else if (cmd === 'publish') {
    const out = publishLive(store, liveDir);
    publishRegistry(store, connectors.map((c) => c.meta), liveDir);
    const ev = publishEvents(store, publicDir);
    console.log(`published: ${out.written.join(', ')} | incidents: ${ev.count}`);
  } else if (cmd === 'serve') {
    const port = Number(args[0] ?? 8787);
    serve(store, connectors.map((c) => c.meta), port);
    console.log(`API on http://localhost:${port}/api/datasets`);
  } else {
    for (const c of connectors) {
      const latest = store.latest(c.meta.id);
      console.log(
        c.meta.id.padEnd(22),
        c.meta.status.padEnd(16),
        latest ? `${latest.record_count} records @ ${latest.retrieved_at}` : (c.meta.blocked_reason ? 'blocked here' : 'no snapshot'),
      );
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
