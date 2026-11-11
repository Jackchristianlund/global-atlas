import { describe, expect, it } from 'vitest';
import { LINKS } from '../src/data';
import { LINK, onwardLinks, rootLinks, traceLinks } from '../src/lib/trace';

describe('relationship tracing', () => {
  it('chains only through matching endpoints', () => {
    // Iran war -> Strait of Hormuz, then onward to documented importers
    const toHormuz = LINKS.find((l) => l.conflict === 'iran' && l.type === 'shipping' && !l.from.iso === false)!;
    expect(toHormuz).toBeDefined();
    const onward = onwardLinks(toHormuz.id);
    expect(onward.length).toBeGreaterThanOrEqual(5);
    const isos = onward.map((l) => l.to.iso).filter(Boolean);
    for (const want of ['CHN', 'IND', 'JPN', 'KOR']) expect(isos).toContain(want);
    // and never the reverse of itself
    expect(onward.some((l) => l.to.iso === toHormuz.from.iso)).toBe(false);
  });
  it('every hop in a trace is itself a documented, sourced link', () => {
    const first = rootLinks('iran')[0];
    const second = onwardLinks(first.id)[0] ?? first;
    for (const l of traceLinks([first.id, second.id])) {
      expect(l.evidence[0].length).toBeGreaterThan(0);
      expect(l.s.length).toBeGreaterThan(0);
      expect(['observed', 'assessed', 'potential']).toContain(l.kind);
    }
  });
  it('rootLinks and LINK lookups resolve', () => {
    expect(rootLinks('ukr').length).toBeGreaterThanOrEqual(4);
    expect(rootLinks('nope')).toHaveLength(0);
    expect(onwardLinks('does-not-exist')).toHaveLength(0);
    expect(Object.keys(LINK).length).toBe(LINKS.length);
  });
});
