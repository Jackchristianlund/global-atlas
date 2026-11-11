/**
 * Conflict-event deduplication.
 * Within one source, the source's own event id is authoritative. Across fetches,
 * events are deduplicated on a stable key so re-ingestion is idempotent. Events
 * from different sources (UCDP GED vs ACLED) are NEVER merged into one record:
 * their definitions differ, so cross-source "fusion" would manufacture data.
 */
import { createHash } from 'node:crypto';
export function eventKey(e) {
    if (e.source_event_id)
        return `${e.source}:${e.source_event_id}`;
    const h = createHash('sha256')
        .update([e.source, e.date, e.lat.toFixed(4), e.lng.toFixed(4), [...e.actors].sort().join('|'), e.event_type].join('\u0000'))
        .digest('hex')
        .slice(0, 16);
    return `${e.source}:h:${h}`;
}
export function dedupeEvents(events) {
    const seen = new Map();
    let duplicates = 0;
    for (const e of events) {
        const k = eventKey(e);
        if (seen.has(k))
            duplicates++;
        else
            seen.set(k, e);
    }
    return { unique: [...seen.values()], duplicates };
}
