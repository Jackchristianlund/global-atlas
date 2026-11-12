import { useMemo } from 'react';
import { COUNTRY_CODES, ORGS, SNAPSHOT_DATE, countryName } from '../data';
import { STATUS_COLOR } from '../lib/selectors';
import { useStore, type StatusFilter } from '../store';
import { fmtDate, fmtNum, useT, type StrKey } from '../i18n';
import { Ad } from './Commerce';
import type { ConflictType, LayerId } from '../types';

/**
 * The layers, grouped by what they are about rather than listed flat.
 *
 * Seventeen checkboxes in one column is a wall: the reader has to read every
 * label to find the one they want, and the fact that control, the front line
 * and the derived contact lines belong together is invisible. Grouping says
 * that much without a word of explanation.
 */
const GROUPS: { id: StrKey; layers: LayerId[] }[] = [
  { id: 'g_control', layers: ['territories', 'sourceline', 'fronts'] },
  { id: 'g_events', layers: ['conflicts', 'flashpoints', 'attacks', 'incidents', 'events'] },
  { id: 'g_trade', layers: ['routes', 'chokepoints', 'energy', 'sanctions'] },
  { id: 'g_people', layers: ['displacement', 'alliances', 'links'] },
  { id: 'g_base', layers: ['borders', 'hydro'] },
];
const STATUSES: { k: StatusFilter; c: string }[] = [
  { k: 'tier4', c: STATUS_COLOR.tier4 }, { k: 'tier3', c: STATUS_COLOR.tier3 }, { k: 'tier2', c: STATUS_COLOR.tier2 },
  { k: 'tier1', c: STATUS_COLOR.tier1 }, { k: 'ceasefire', c: STATUS_COLOR.ceasefire }, { k: 'flashpoint', c: STATUS_COLOR.flashpoint },
];
const TYPES: (ConflictType | 'all')[] = ['all', 'interstate', 'civil', 'insurgency', 'proxy', 'territorial', 'nonstate', 'separatist', 'border'];

export default function LeftSidebar() {
  const { t, lang } = useT();
  const s = useStore();
  const names = useMemo(
    () => COUNTRY_CODES.map((c) => [c, countryName(c, lang)] as const).sort((a, b) => a[1].localeCompare(b[1], lang === 'no' ? 'nb' : 'en')),
    [lang],
  );
  return (
    <aside className={`panel left${s.leftOpen ? ' open' : ''}`} aria-label={t('filters')}>
      <div className="panel-bar">
        <span className="panel-title">{t('filters')}</span>
        <button type="button" className="mini only-desktop fold" onClick={() => s.setCollapsed('left', true)} aria-label={t('hidePanel')} title={t('hidePanel')}>‹</button>
        <button type="button" className="mini only-mobile" onClick={() => s.setLeftOpen(false)} aria-label={t('close')}>✕</button>
      </div>
      <div className="panel-scroll">
        <section className="sec">
          <h3>{t('layers')}</h3>
          {GROUPS.map((g) => {
            const on = g.layers.filter((l) => s.layers[l]).length;
            return (
          <div className="laygroup" key={g.id}>
            <h4>
              {t(g.id)}
              {/* How many of this group are on, so a collapsed-looking group
                  still says whether anything in it is showing. */}
              <span className={on ? 'on' : ''}>{on}/{g.layers.length}</span>
            </h4>
          <ul className="opts">
            {g.layers.map((l) => (
              <li key={l} className="layerrow">
                <label><input type="checkbox" checked={s.layers[l]} onChange={() => s.toggleLayer(l)} /><span>{t(`l_${l}`)}</span></label>
                {s.layers[l] && (
                  <input
                    className="op-slider" type="range" min={0.15} max={1} step={0.05} value={s.layerOpacity[l]}
                    onChange={(e) => s.setOpacity(l, Number(e.target.value))}
                    aria-label={`${t('opacity')}: ${t(`l_${l}`)}`} title={t('opacity')}
                  />
                )}
                {l === 'incidents' && s.layers.incidents && (
                  <p className="layernote">
                    {s.incidentState.busy
                      ? t('inc_loading')
                      : s.incidentState.n > 0
                        ? `${fmtNum(s.incidentState.n, lang)} ${t('inc_loaded')}`
                        : t('inc_none')}
                  </p>
                )}
              </li>
            ))}
          </ul>
          </div>
            );
          })}
        </section>

        <section className="sec">
          <h3>{t('intensity')}</h3>
          <ul className="opts">
            {STATUSES.map(({ k, c }) => (
              <li key={k}>
                <label><input type="checkbox" checked={s.statusOn[k]} onChange={() => s.toggleStatus(k)} /><span className="dot" style={{ background: c }} /><span>{t(k)}</span></label>
              </li>
            ))}
          </ul>
          {s.year < Number(SNAPSHOT_DATE.slice(0, 4)) && <p className="note">{t('historic')}</p>}
        </section>

        <section className="sec">
          <h3>{t('category')}</h3>
          <select value={s.typeFilter} onChange={(e) => s.setTypeFilter(e.target.value as ConflictType | 'all')} aria-label={t('category')}>
            {TYPES.map((ty) => <option key={ty} value={ty}>{ty === 'all' ? t('all') : t(`t_${ty}`)}</option>)}
          </select>
        </section>

        <section className="sec">
          <h3>{t('country')}</h3>
          <select value={s.sel?.kind === 'country' ? s.sel.id : ''} onChange={(e) => e.target.value && s.select({ kind: 'country', id: e.target.value })} aria-label={t('country')}>
            <option value="">{t('chooseCountry')}</option>
            {names.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
          </select>
        </section>

        <section className="sec">
          <h3>{t('orgs')}</h3>
          <ul className="opts">
            {ORGS.filter((o) => o.id !== 'un').map((o) => (
              <li key={o.id}>
                <label>
                  <input type="radio" name="org" checked={s.layers.alliances && s.orgId === o.id} onChange={() => { s.setOrg(o.id); s.select({ kind: 'org', id: o.id }); }} />
                  <span className="dot" style={{ background: o.color }} /> {o.short} <small className="meta">{t(`kind_${o.kind}`)}</small>
                </label>
              </li>
            ))}
            <li>
              <label>
                <input type="radio" name="org" checked={!s.layers.alliances} onChange={() => s.setOrg(null)} /> {t('none')}
              </label>
            </li>
          </ul>
        </section>

        <section className="sec">
          <h3>{t('lowPower')}</h3>
          <label><input type="checkbox" checked={s.lowPower} onChange={(e) => s.setLowPower(e.target.checked)} /> {t('lowPower')}</label>
        </section>

        <p className="note foot">{t('snapshot')}: {fmtDate(SNAPSHOT_DATE, lang)} · {t('footer')}</p>
        <Ad slot="left" />
      </div>
    </aside>
  );
}
