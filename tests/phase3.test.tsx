// @vitest-environment jsdom
// Phase-3 components exercised in a DOM (zustand v5 serves initial state to SSR).
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Legend from '../src/components/Legend';
import TraceSection from '../src/components/TraceSection';
import { useStore } from '../src/store';
import { tr } from '../src/i18n';
import { onwardLinks, rootLinks } from '../src/lib/trace';

let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
const render = (ui: React.ReactNode) => {
  act(() => root.render(ui));
  return host.innerHTML;
};

beforeEach(() => {
  useStore.setState({ trace: [], legendOpen: false, lang: 'no' });
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => act(() => root.unmount()));

describe('legend', () => {
  it('collapses to a toggle and expands to explain every symbol class', () => {
    // Collapsed is a compact key that is always on screen, not a bare button:
    // the marks a reader needs to make sense of the globe should not be hidden
    // behind something they have to find first.
    const mini = render(<Legend />);
    expect(mini).toContain('legend-mini');
    expect(mini).toContain('legend-more');
    for (const key of ['tier4', 'lg_terrGov', 'lg_terrOcc', 'ct_line']) {
      expect(mini, key).toContain(tr(key as 'tier4', 'no'));
    }
    act(() => useStore.setState({ legendOpen: true }));
    const html = host.innerHTML;
    for (const want of ['Tegnforklaring', 'Symboler', 'Knutepunkt til sjøs', 'Omstridt område', 'Observert', 'Vurdert', 'Mulig']) {
      expect(html, want).toContain(want);
    }
    expect((html.match(/class="sw/g) ?? []).length).toBeGreaterThan(20);
  });
});

describe('trace section', () => {
  const firstHop = () => rootLinks('iran').find((l) => l.type === 'shipping')!;

  it('renders nothing when no connection is being followed', () => {
    expect(render(<TraceSection />)).toBe('');
  });

  it('shows the current hop with evidence, mechanism, sources and onward options', () => {
    useStore.setState({ trace: [firstHop().id] });
    const html = render(<TraceSection />);
    expect(html).toContain('Sporing av kobling');
    expect(html).toContain('Belegg');
    expect(html).toContain('Mekanisme');
    expect(html).toContain('class="src"');
    expect(html).toContain('Dokumenterte koblinger videre');
    expect(html).not.toContain('Ett steg tilbake');
  });

  it('following a hop extends the chain and offers a step back', () => {
    const first = firstHop();
    useStore.setState({ trace: [first.id] });
    render(<TraceSection />);
    const next = onwardLinks(first.id)[0];
    act(() => useStore.getState().pushTrace(next.id));
    expect(host.innerHTML).toContain('Ett steg tilbake');
    expect(useStore.getState().trace).toEqual([first.id, next.id]);
    act(() => useStore.getState().popTrace());
    expect(useStore.getState().trace).toEqual([first.id]);
    act(() => useStore.getState().clearTrace());
    expect(host.innerHTML).toBe('');
  });

  it('selecting something new clears an open trace', () => {
    useStore.setState({ trace: [firstHop().id] });
    act(() => useStore.getState().select({ kind: 'conflict', id: 'ukr' }));
    expect(useStore.getState().trace).toEqual([]);
  });
});
