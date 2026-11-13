import { describe, expect, it } from 'vitest';
import { wrap } from '../src/lib/snapshot';
import { snapshotName, snapshotText } from '../src/components/SnapshotButton';
import { useStore } from '../src/store';

// A fixed-width "font": every character is 1 unit wide.
const mono = { measureText: (s: string) => ({ width: s.length }) as TextMetrics };

describe('image export', () => {
  it('wraps source lines at word boundaries and loses no words', () => {
    const text = 'Frontline: UN OCHA Ukraine, assessed 2026-10-31, not real-time';
    const lines = wrap(mono, text, 20);
    expect(lines.every((l) => l.length <= 20)).toBe(true);
    expect(lines.join(' ')).toBe(text);
  });

  it('keeps a word longer than the width on its own line rather than dropping it', () => {
    expect(wrap(mono, 'a verylongwordindeed b', 5)).toEqual(['a', 'verylongwordindeed', 'b']);
  });

  it('always states the year and that it is not real-time', () => {
    useStore.setState({ sel: null, mapMode: 'globe' });
    const no = snapshotText('no', null);
    expect(no.dated).toContain(String(useStore.getState().year));
    expect(no.dated).toContain('ikke sanntid');
    expect(no.sources.length).toBeGreaterThan(0);
    expect(no.credit).toContain('jackchristianlund.github.io/global-atlas');
    expect(snapshotText('en', null).dated).toContain('not real-time');
  });

  it('names the war and its front-line date when Ukraine is selected', () => {
    useStore.setState({ sel: { kind: 'conflict', id: 'ukr' } });
    const s = snapshotText('en', null);
    expect(s.title.toLowerCase()).toContain('ukraine');
    expect(s.dated).toMatch(/front line assessed/);
    expect(snapshotName()).toMatch(/^global-atlas-ukr-\d{4}-\d{2}-\d{2}\.png$/);
    useStore.setState({ sel: null });
  });

  it('does not credit ISW unless its polygons are loaded', () => {
    useStore.setState({ control: { status: 'idle' }, sel: { kind: 'conflict', id: 'ukr' } });
    const s = snapshotText('en', null);
    expect(s.sources.join(' ')).not.toMatch(/ISW/);
    expect(s.legend.some((l) => l.color === '#D6453D')).toBe(false);
    useStore.setState({ sel: null });
  });
});
