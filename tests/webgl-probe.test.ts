// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWebgl2Probe, webgl2Available } from '../src/map/styles';

afterEach(() => {
  vi.restoreAllMocks();
  resetWebgl2Probe();
});

/**
 * The regression this guards against crashed the globe.
 *
 * `useRef(webgl2Available())` evaluates its argument on every render and keeps
 * only the first result, so the probe ran on each render of the regional map.
 * Every run created a canvas and took a WebGL context. A browser allows only a
 * handful of live contexts and kills the oldest to make room, so after enough
 * renders the globe's own context was taken away and the Earth went black.
 */
describe('the WebGL2 capability probe', () => {
  it('creates at most one canvas however many times it is asked', () => {
    const spy = vi.spyOn(document, 'createElement');
    for (let i = 0; i < 200; i++) webgl2Available();
    const canvases = spy.mock.calls.filter(([tag]) => tag === 'canvas').length;
    expect(canvases).toBeLessThanOrEqual(1);
  });

  it('hands the probe context straight back', () => {
    const lose = vi.fn();
    const gl = { getExtension: vi.fn(() => ({ loseContext: lose })) };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(gl as never);
    expect(webgl2Available()).toBe(true);
    expect(gl.getExtension).toHaveBeenCalledWith('WEBGL_lose_context');
    expect(lose).toHaveBeenCalled();
  });

  it('answers the same way every time', () => {
    const first = webgl2Available();
    for (let i = 0; i < 20; i++) expect(webgl2Available()).toBe(first);
  });

  it('reports no WebGL2 rather than throwing when the browser refuses', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => { throw new Error('nope'); });
    expect(webgl2Available()).toBe(false);
  });

  it('caches a negative answer too, so a refusal is not re-probed', () => {
    const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    for (let i = 0; i < 50; i++) webgl2Available();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
