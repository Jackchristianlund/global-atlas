import type { Conflict, ConflictType, LayerId } from '../types';
import { conflictsAt, displayStatus } from './selectors';

interface Filters {
  year: number;
  snapshotYear: number;
  layers: Record<LayerId, boolean>;
  statusOn: Record<'tier4' | 'tier3' | 'tier2' | 'tier1' | 'ceasefire' | 'flashpoint', boolean>;
  typeFilter: ConflictType | 'all';
}

/** Conflicts that pass the year, layer, status and type filters. Shared by the globe and the lists. */
export function visibleConflicts(all: Conflict[], f: Filters): Conflict[] {
  return conflictsAt(all, f.year).filter((c) => {
    const ds = displayStatus(c, f.year, f.snapshotYear);
    if (ds === 'flashpoint') return f.layers.flashpoints && f.statusOn.flashpoint;
    if (!f.layers.conflicts) return false;
    if (f.typeFilter !== 'all' && c.type !== f.typeFilter) return false;
    if (ds === 'historic' || ds === 'unrated') return true;
    return f.statusOn[ds];
  });
}
