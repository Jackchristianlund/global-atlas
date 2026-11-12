// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from '../src/store';

beforeEach(() => {
  localStorage.clear();
  useStore.setState({ leftCollapsed: false, rightCollapsed: false, eventsCollapsed: false, sel: null });
});

describe('folding the chrome away', () => {
  it('folds each part independently', () => {
    useStore.getState().setCollapsed('left', true);
    expect(useStore.getState().leftCollapsed).toBe(true);
    expect(useStore.getState().rightCollapsed).toBe(false);
    expect(useStore.getState().eventsCollapsed).toBe(false);
  });

  it('remembers the choice', () => {
    useStore.getState().setCollapsed('right', true);
    useStore.getState().setCollapsed('events', true);
    expect(localStorage.getItem('ga.c.right')).toBe('1');
    expect(localStorage.getItem('ga.c.events')).toBe('1');
    useStore.getState().setCollapsed('right', false);
    expect(localStorage.getItem('ga.c.right')).toBe('0');
  });

  it('brings the detail panel back when something is selected', () => {
    // A click on a conflict that appears to do nothing is the worst outcome a
    // fold could have.
    useStore.getState().setCollapsed('right', true);
    useStore.getState().select({ kind: 'conflict', id: 'ukr' });
    expect(useStore.getState().rightCollapsed).toBe(false);
  });

  it('leaves the stored preference alone when it does', () => {
    useStore.getState().setCollapsed('right', true);
    useStore.getState().select({ kind: 'conflict', id: 'ukr' });
    expect(localStorage.getItem('ga.c.right')).toBe('1');
  });

  it('does not unfold anything on deselect', () => {
    useStore.getState().setCollapsed('right', true);
    useStore.getState().select(null);
    expect(useStore.getState().rightCollapsed).toBe(true);
  });

  it('never touches the filter panel when a selection is made', () => {
    useStore.getState().setCollapsed('left', true);
    useStore.getState().select({ kind: 'conflict', id: 'ukr' });
    expect(useStore.getState().leftCollapsed).toBe(true);
  });
});
