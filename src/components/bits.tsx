import type { ReactNode } from 'react';
import { CONFLICT, SOURCES, countryName } from '../data';
import { STATUS_COLOR, displayStatus } from '../lib/selectors';
import { SNAPSHOT_YEAR, useStore } from '../store';
import { fmtDate, useT } from '../i18n';
import type { Claim, Figure, Iso } from '../types';

const SOURCE_NO: Record<string, number> = Object.fromEntries(Object.keys(SOURCES).map((k, i) => [k, i + 1]));

/** Numbered, clickable source references. Numbers match the list in "Methodology and sources". */
export function Src({ ids }: { ids: string[] }) {
  if (!ids.length) return null;
  return (
    <span className="srcs">
      {ids.map((id) => {
        const s = SOURCES[id];
        if (!s) return null;
        return (
          <a key={id} className="src" href={s.url} target="_blank" rel="noopener noreferrer" title={`${s.publisher}: ${s.title} (${s.date})`}>
            {SOURCE_NO[id]}
          </a>
        );
      })}
    </span>
  );
}

export function SourceList({ ids }: { ids: string[] }) {
  const { lang } = useT();
  return (
    <ol className="srclist">
      {ids.map((id) => {
        const s = SOURCES[id];
        if (!s) return null;
        return (
          <li key={id} value={SOURCE_NO[id]}>
            <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>
            <span className="meta"> {s.publisher} · {fmtDate(s.date, lang)}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="sec">
      <h3>{title}{aside}</h3>
      {children}
    </section>
  );
}

export function ClaimRow({ c }: { c: Claim }) {
  const { t, tl, lang } = useT();
  return (
    <li className={`claim k-${c.kind}`}>
      <div className="claim-head">
        <span className={`badge k-${c.kind}`}>{t(`k_${c.kind}`)}</span>
        <time dateTime={c.d}>{fmtDate(c.d, lang)}</time>
        <Src ids={c.s} />
      </div>
      <p>{tl(c.t)}</p>
    </li>
  );
}

export function FigRow({ f }: { f: Figure }) {
  const { t, tl, lang } = useT();
  return (
    <li className="fig">
      <div className="fig-l">{tl(f.l)}</div>
      <div className={`fig-v${f.v ? '' : ' na'}`}>{f.v ? tl(f.v) : t('na')}</div>
      <div className="fig-m">
        {tl(f.m)} <span className="meta">{t('asOf')} {fmtDate(f.d, lang)}</span> <Src ids={f.s} />
      </div>
    </li>
  );
}

export function CountryChip({ iso }: { iso: Iso }) {
  const { lang } = useT();
  const select = useStore((s) => s.select);
  return (
    <button type="button" className="chip" onClick={() => select({ kind: 'country', id: iso })}>
      {countryName(iso, lang)}
    </button>
  );
}

export function ConflictLink({ id }: { id: string }) {
  const { tl } = useT();
  const select = useStore((s) => s.select);
  const year = useStore((s) => s.year);
  const c = CONFLICT[id];
  if (!c) return null;
  return (
    <button type="button" className="rowbtn" onClick={() => select({ kind: 'conflict', id })}>
      <span className="dot" style={{ background: STATUS_COLOR[displayStatus(c, year, SNAPSHOT_YEAR)] }} />
      <span>{tl(c.name)}</span>
    </button>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}
