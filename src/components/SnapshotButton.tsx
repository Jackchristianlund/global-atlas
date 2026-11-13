import { useState } from 'react';
import { useStore } from '../store';
import { useT, fmtDate, pick, tr } from '../i18n';
import { CONFLICT } from '../data';
import { STATUS_COLOR } from '../lib/selectors';
import { captureFor, compose, download, type LegendItem, type SnapshotText } from '../lib/snapshot';
import type { Lang } from '../types';

const SITE = 'jackchristianlund.github.io/global-atlas';

/** What the picture says about itself, built from the same state the screen is drawn from. */
export function snapshotText(lang: Lang, attribution: string | null): SnapshotText {
  const s = useStore.getState();
  const t = (k: Parameters<typeof tr>[0]) => tr(k, lang);
  const conflict = s.sel?.kind === 'conflict' ? CONFLICT[s.sel.id] : undefined;
  const meta = s.frontline.set.meta;
  const ctl = s.control.status === 'ready' ? s.control.layer : null;
  const change = s.controlChange.status === 'ready' ? s.controlChange.change : null;
  // The control polygons are fetched only near Ukraine, so their presence in
  // the store is the test for whether they are on screen.
  const ctlShown = !!ctl && (s.mapMode === 'map' || conflict?.id === 'ukr');

  const legend: LegendItem[] = [
    { kind: 'dot', color: STATUS_COLOR.tier4, label: t('tier4') },
    { kind: 'dot', color: STATUS_COLOR.tier2, label: t('tier2') },
    { kind: 'box', color: 'rgba(77,140,255,.75)', label: t('lg_terrGov') },
    { kind: 'box', color: 'rgba(214,69,61,.75)', label: t('lg_terrOcc') },
    { kind: 'line', color: '#FFD678', label: t('ct_line') },
  ];
  if (ctlShown && ctl.source === 'isw') {
    legend.push(
      { kind: 'box', color: '#D6453D', label: t('ctl_title') },
      { kind: 'box', color: '#E35D55', label: t('ctl_adv') },
      { kind: 'box', color: '#F08A4B', label: t('ctl_inf') },
    );
  } else if (ctlShown) legend.push({ kind: 'box', color: '#D6453D', label: t('ctl_title') });
  if (ctlShown && change) {
    legend.push(
      { kind: 'box', color: '#FFB020', label: t('cs_gained') },
      { kind: 'box', color: '#5CE1FF', label: t('cs_lost') },
    );
  }

  const dated = [
    `${t('snap_year')} ${s.year}`,
    conflict?.id === 'ukr' || ctlShown ? `${t('snap_front')} ${fmtDate(meta.assessmentDate, lang)}` : null,
    ctlShown ? `${t('snap_ctl')} ${fmtDate(ctl.asOf, lang)}` : null,
    change ? `${t('cs_since')}: ${fmtDate(change.since, lang)}` : null,
    t('notRealtime'),
  ].filter(Boolean).join(' · ');

  const sources = [
    attribution ?? t('snap_globe'),
    conflict?.id === 'ukr' || ctlShown ? meta.attribution : null,
    ctlShown && ctl.source === 'isw' && !attribution?.includes('ISW') ? t('ctl_iswCredit') : null,
    t('snap_conflict'),
  ].filter((x): x is string => !!x);

  return {
    title: conflict ? pick(conflict.name, lang) : t('snap_world'),
    dated,
    legend,
    sources,
    credit: `Global Atlas · ${SITE} · ${new Date().toISOString().slice(0, 10)}`,
  };
}

export function snapshotName(): string {
  const s = useStore.getState();
  const id = s.sel?.kind === 'conflict' ? s.sel.id : s.mapMode === 'map' ? 'map' : 'globe';
  return `global-atlas-${id}-${new Date().toISOString().slice(0, 10)}.png`;
}

/** "Download image": the current view, with its key, its sources and its date. */
export default function SnapshotButton() {
  const { t, lang } = useT();
  const mode = useStore((s) => s.mapMode);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const run = async () => {
    const capture = captureFor(mode === 'map' ? 'map' : 'globe');
    if (!capture || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const frame = await capture();
      const attribution = mode === 'map' ? document.querySelector('.mapattr')?.textContent?.trim() || null : null;
      await download(compose(frame, snapshotText(lang, attribution)), snapshotName());
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="vs-snap"
        onClick={() => void run()}
        aria-disabled={busy}
        aria-busy={busy}
        title={failed ? t('snap_fail') : t('snap_btn')}
      >
        <span aria-hidden="true">{busy ? '…' : failed ? '⚠' : '⤓'} </span>{busy ? t('snap_busy') : t('snap_btn')}
      </button>
      {/* Said once, to screen readers too: a disabled-looking button alone does not explain itself. */}
      <span className="sr-only" role="status">{failed ? t('snap_fail') : ''}</span>
    </>
  );
}
