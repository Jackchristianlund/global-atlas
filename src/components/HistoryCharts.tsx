import { useMemo, useState } from 'react';
import { PRIO_COUNTS, PRIO_DEATHS, REGION_NAMES } from '../data/live';
import { useStore } from '../store';
import { fmtNum, useT } from '../i18n';
import { LiveMetaLine } from './DataBits';

const W = 352;
const H = 136;
const PAD = { l: 40, r: 10, t: 8, b: 17 };

const REGION_COLOR: Record<string, string> = {
  Africa: '#7BD389', Americas: '#00D9FF', 'Asia & Oceania': '#FFD23F', Europe: '#4D8CFF', 'Middle East': '#FF4545',
};
const TYPE_COLOR: Record<string, string> = { civil: '#FF9B42', civil_intl: '#FF4545', interstate: '#4D8CFF', colonial: '#8FA2BC' };

/** Round a maximum up to a tidy axis ceiling (1, 2, 2.5, 5 × 10ⁿ). */
function niceMax(v: number): number {
  const p = 10 ** Math.floor(Math.log10(Math.max(v, 1)));
  for (const m of [1, 2, 2.5, 5, 10]) if (v <= m * p) return m * p;
  return 10 * p;
}

function scales(years: number[], maxV: number) {
  const y0 = years[0];
  const y1 = years[years.length - 1];
  const x = (yr: number) => PAD.l + ((yr - y0) / (y1 - y0)) * (W - PAD.l - PAD.r);
  const y = (v: number) => H - PAD.b - (v / maxV) * (H - PAD.t - PAD.b);
  return { x, y, y0, y1 };
}

interface FrameProps {
  years: number[];
  maxV: number;
  hover: number | null;
  onHover: (year: number | null) => void;
  onPick: (year: number) => void;
  children: React.ReactNode;
}

function ChartFrame({ years, maxV, hover, onHover, onPick, children }: FrameProps) {
  const { lang } = useT();
  const year = useStore((s) => s.year);
  const { x, y, y0, y1 } = scales(years, maxV);
  const yearAt = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const f = Math.min(1, Math.max(0, (px - PAD.l) / (W - PAD.l - PAD.r)));
    return Math.round(y0 + f * (y1 - y0));
  };
  const sel = Math.min(Math.max(year, y0), y1);
  const ax = (v: number) => (maxV >= 1e6 ? `${fmtNum(v / 1e6, lang, 1)}M` : maxV >= 10000 ? `${fmtNum(v / 1000, lang)}k` : fmtNum(v, lang));
  const decades = years.filter((yr) => yr % 20 === 0);
  return (
    <svg
      className="hchart" viewBox={`0 0 ${W} ${H}`} role="img"
      onClick={(e) => onPick(yearAt(e))}
      onMouseMove={(e) => onHover(yearAt(e))}
      onMouseLeave={() => onHover(null)}
    >
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(maxV * f)} y2={y(maxV * f)} className={f === 0 ? 'base' : 'grid'} />
          {f > 0 && <text x={PAD.l - 5} y={y(maxV * f) + 3} textAnchor="end" className="ax">{ax(maxV * f)}</text>}
        </g>
      ))}
      {decades.map((yr) => (
        <g key={yr}>
          <line x1={x(yr)} x2={x(yr)} y1={H - PAD.b} y2={H - PAD.b + 3} className="base" />
          <text x={x(yr)} y={H - 4} textAnchor="middle" className="ax">{yr}</text>
        </g>
      ))}
      {children}
      <line x1={x(sel)} x2={x(sel)} y1={PAD.t} y2={H - PAD.b} className="selline" />
      {hover !== null && hover !== sel && <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} className="hoverline" />}
    </svg>
  );
}

/** Real PRIO/UCDP series: deaths by region (lines) and conflict counts by type (stacked areas). */
export default function HistoryCharts() {
  const { t, tl, lang } = useT();
  const { year, setYear, setPlaying } = useStore();
  const [hover, setHover] = useState<number | null>(null);
  const pick = (y: number) => { setPlaying(false); setYear(y); };

  const deaths = useMemo(() => {
    const regions = Object.keys(REGION_COLOR).filter((r) => PRIO_DEATHS.series[r]);
    const ki = PRIO_DEATHS.keys.indexOf('all') + 1;
    const years = PRIO_DEATHS.series[regions[0]].map((r) => r[0] as number);
    let maxV = 0;
    const lines = regions.map((reg) => {
      const pts = PRIO_DEATHS.series[reg].map((r) => [r[0] as number, (r[ki] as number) ?? 0] as const);
      for (const [, v] of pts) maxV = Math.max(maxV, v);
      return { reg, pts, byYear: new Map(pts) };
    });
    return { regions, years, maxV: niceMax(maxV), lines };
  }, []);

  const counts = useMemo(() => {
    const ks = ['colonial', 'interstate', 'civil', 'civil_intl'];
    const rows = PRIO_COUNTS.series.World ?? [];
    const years = rows.map((r) => r[0] as number);
    const idx = ks.map((k) => PRIO_COUNTS.keys.indexOf(k) + 1);
    let maxV = 0;
    const stacked = rows.map((r) => {
      let acc = 0;
      const vals = idx.map((ki) => (r[ki] as number) ?? 0);
      const layers = vals.map((v) => { const y0 = acc; acc += v; return [y0, acc] as const; });
      maxV = Math.max(maxV, acc);
      return { year: r[0] as number, layers, vals };
    });
    return { ks, years, maxV: niceMax(maxV), stacked, byYear: new Map(stacked.map((s) => [s.year, s])) };
  }, []);

  const d = scales(deaths.years, deaths.maxV);
  const c = scales(counts.years, counts.maxV);
  const clamp = (yr: number, ys: number[]) => Math.min(Math.max(yr, ys[0]), ys[ys.length - 1]);
  const dYear = clamp(hover ?? year, deaths.years);
  const cYear = clamp(hover ?? year, counts.years);
  const cRow = counts.byYear.get(cYear);

  return (
    <section className="sec">
      <h3>{t('hc_deaths')}</h3>
      <ChartFrame years={deaths.years} maxV={deaths.maxV} hover={hover} onHover={setHover} onPick={pick}>
        {deaths.lines.map(({ reg, pts, byYear }) => (
          <g key={reg}>
            <path
              d={pts.map(([yy, v], i) => `${i ? 'L' : 'M'}${d.x(yy).toFixed(1)},${d.y(v).toFixed(1)}`).join('')}
              fill="none" stroke={REGION_COLOR[reg]} strokeWidth={1.5} strokeLinejoin="round"
            />
            <circle cx={d.x(dYear)} cy={d.y(byYear.get(dYear) ?? 0)} r={2.6} fill={REGION_COLOR[reg]} stroke="#070B14" strokeWidth={1} />
          </g>
        ))}
      </ChartFrame>
      <div className="readout">
        <span className="ro-year">{dYear}</span>
        {deaths.lines.map(({ reg, byYear }) => (
          <span key={reg}><i style={{ background: REGION_COLOR[reg] }} />{REGION_NAMES[reg] ? tl(REGION_NAMES[reg]) : reg} <b>{fmtNum(byYear.get(dYear) ?? 0, lang)}</b></span>
        ))}
      </div>
      <LiveMetaLine meta={PRIO_DEATHS.meta} />

      <h3 className="mt">{t('hc_counts')}</h3>
      <ChartFrame years={counts.years} maxV={counts.maxV} hover={hover} onHover={setHover} onPick={pick}>
        {counts.ks.map((k, li) => (
          <path
            key={k}
            d={
              counts.stacked.map((s, i) => `${i ? 'L' : 'M'}${c.x(s.year).toFixed(1)},${c.y(s.layers[li][1]).toFixed(1)}`).join('') +
              counts.stacked.slice().reverse().map((s) => `L${c.x(s.year).toFixed(1)},${c.y(s.layers[li][0]).toFixed(1)}`).join('') + 'Z'
            }
            fill={TYPE_COLOR[k]} fillOpacity={0.6} stroke={TYPE_COLOR[k]} strokeWidth={0.6}
          />
        ))}
      </ChartFrame>
      <div className="readout">
        <span className="ro-year">{cYear}</span>
        {counts.ks.map((k, i) => (
          <span key={k}><i style={{ background: TYPE_COLOR[k] }} />{t(`ct_${k}` as 'ct_civil')} <b>{cRow ? cRow.vals[i] : '–'}</b></span>
        ))}
      </div>
      <LiveMetaLine meta={PRIO_COUNTS.meta} />
      <p className="note">{t('hc_click')}</p>
    </section>
  );
}
