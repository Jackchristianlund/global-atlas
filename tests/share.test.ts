import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { CONFLICT } from '../src/data';
import { SHARE_CONFLICTS } from '../src/lib/shareConflicts';
import { sharePage } from '../scripts/build-share-pages';

describe('share pages', () => {
  it('exist only for real conflicts, each with its preview image', () => {
    for (const id of SHARE_CONFLICTS) {
      expect(CONFLICT[id], id).toBeDefined();
      expect(existsSync(`public/og/${id}.jpg`), id).toBe(true);
    }
  });

  it('carry the conflict in the preview and pass the shared view on to the app', () => {
    const html = sharePage('ukr', CONFLICT.ukr.name[0], CONFLICT.ukr.name[1]);
    expect(html).toContain('og:image" content="https://jackchristianlund.github.io/global-atlas/og/ukr.jpg"');
    expect(html).toContain(`<title>${CONFLICT.ukr.name[0]} — Global Atlas</title>`);
    expect(html).toContain('Ikke sanntid');
    // The sharer's hash wins; without one, the conflict is selected.
    expect(html).toContain("location.replace('../../' + (location.hash");
    expect(html).toContain('#s=conflict%3Aukr');
    // A preview crawler that follows meta refresh would land on the front page.
    expect(html).not.toMatch(/http-equiv="refresh"/);
  });

  it('escapes names', () => {
    expect(sharePage('x', 'A "quoted" <b>', 'B')).not.toContain('<b>');
  });
});
