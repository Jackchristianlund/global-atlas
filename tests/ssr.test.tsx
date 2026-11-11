// Smoke-render of the new data-facing components (no browser needed).
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import HistoryCharts from '../src/components/HistoryCharts';
import { ExtSeries } from '../src/components/DataBits';
import { DataPanel } from '../src/components/Modals';

describe('phase-2 components render', () => {
  it('HistoryCharts draws both real-series charts with attribution', () => {
    const html = renderToString(<HistoryCharts />);
    expect(html).toContain('hchart');
    expect(html).toContain('Our World in Data');
    expect((html.match(/<svg/g) ?? []).length).toBe(2);
  });
  it('ExtSeries shows sourced figures for Norway and an honest empty state for Tuvalu', () => {
    const nor = renderToString(<ExtSeries code="NOR" />);
    expect(nor).toContain('SIPRI');
    expect(nor).toContain('TWh');
    expect(nor).toContain('2024');
    const tuv = renderToString(<ExtSeries code="TUV" />);
    expect(tuv).toContain('Ingen serier');
  });
  it('DataPanel lists every registry row with status and licence', () => {
    const html = renderToString(<DataPanel />);
    expect(html).toContain('ACLED');
    expect(html).toContain('UCDP');
    expect(html).toContain('PortWatch');
    expect(html).toContain('Integrert');
    expect((html.match(/dcard/g) ?? []).length).toBeGreaterThanOrEqual(11);
  });
});
