import { describe, expect, it } from 'vitest';
import { LINKS } from '../src/data/links';
import { CONFLICT } from '../src/data';

/**
 * The impact chain is where this app is most tempted to overclaim: a tidy
 * arrow from a war to a price rise reads as cause whether or not anybody
 * established one. These guard the parts that stop it.
 */
describe('impact links', () => {
  it('says how well each effect is known', () => {
    for (const l of LINKS) {
      expect(['observed', 'assessed', 'potential']).toContain(l.kind);
      expect(['high', 'medium', 'low']).toContain(l.confidence);
    }
  });

  it('gives evidence and a mechanism for every link', () => {
    // An arrow without a mechanism is an assertion that two things are near
    // each other, drawn as if it were a cause.
    for (const l of LINKS) {
      expect(l.evidence[0].length, `${l.id} has no evidence`).toBeGreaterThan(20);
      expect(l.mechanism[0].length, `${l.id} has no mechanism`).toBeGreaterThan(20);
      expect(l.evidence[1].length).toBeGreaterThan(20);
      expect(l.mechanism[1].length).toBeGreaterThan(20);
    }
  });

  it('sources everything that claims to be observed', () => {
    for (const l of LINKS.filter((x) => x.kind === 'observed')) {
      expect(l.s.length, `${l.id} is called observed with no source`).toBeGreaterThan(0);
    }
  });

  it('dates every link', () => {
    for (const l of LINKS) expect(l.d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('attaches every link to a conflict that exists', () => {
    for (const l of LINKS) expect(CONFLICT[l.conflict], `${l.id} points at ${l.conflict}`).toBeTruthy();
  });

  it('never claims high confidence for something that has not happened', () => {
    // A possible effect is possible. Calling it high-confidence is a claim
    // about a future that has not arrived.
    for (const l of LINKS.filter((x) => x.kind === 'potential')) {
      expect(l.confidence, `${l.id} is potential but high confidence`).not.toBe('high');
    }
  });

  it('gives both ends of every link a place', () => {
    for (const l of LINKS) {
      for (const end of [l.from, l.to]) {
        expect(Math.abs(end.at[0])).toBeLessThanOrEqual(90);
        expect(Math.abs(end.at[1])).toBeLessThanOrEqual(180);
        expect(end.label[0].length).toBeGreaterThan(1);
      }
    }
  });
});
