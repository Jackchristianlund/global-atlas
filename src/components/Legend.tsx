import { EVENT_COLOR, REL_COLOR } from '../data';
import { ACTORS, REGION } from '../data/territory';
import { STATUS_COLOR } from '../lib/selectors';
import { CATEGORIES, CATEGORY_COLOR } from '../lib/attacks';
import { useStore } from '../store';
import { useT } from '../i18n';
import type { EventType, RelType } from '../types';

const ROUTE_SW: { key: 'rk_sea' | 'rk_oil' | 'rk_lng' | 'rk_rail' | 'rk_pipeline'; c: string }[] = [
  { key: 'rk_sea', c: '#00D9FF' }, { key: 'rk_oil', c: '#FFD23F' }, { key: 'rk_lng', c: '#7BE0C3' },
  { key: 'rk_rail', c: '#C9A2FF' }, { key: 'rk_pipeline', c: '#FF9B42' },
];
const LINK_TYPES: RelType[] = ['defense', 'military', 'sanction', 'energy', 'shipping', 'trade', 'arms', 'displacement', 'diplomatic', 'supply'];
const EVENTS_T: EventType[] = ['escalation', 'ceasefire', 'alliance', 'sanction', 'trade', 'political'];

/** Floating legend: every colour, symbol and line style used on the globe. */
export default function Legend() {
  const { t, tl } = useT();
  const open = useStore((s) => s.legendOpen);
  const setOpen = useStore((s) => s.setLegendOpen);
  if (!open) {
    // A compact key that is always on screen. The full legend is one click
    // away, but the handful of marks a reader needs to make sense of the globe
    // at a glance should not be behind a button they have to find first.
    return (
      <aside className="legend-mini" aria-label={t('legend')}>
        <ul>
          <li><i className="sw dot" style={{ background: STATUS_COLOR.tier4 }} />{t('tier4')}</li>
          <li><i className="sw dot sm" style={{ background: STATUS_COLOR.tier2 }} />{t('tier2')}</li>
          <li><i className="sw box" style={{ background: 'rgba(77,140,255,.55)' }} />{t('lg_terrGov')}</li>
          <li><i className="sw box" style={{ background: 'rgba(214,69,61,.55)' }} />{t('lg_terrOcc')}</li>
          <li><i className="sw line" style={{ background: '#FFD678' }} />{t('ct_line')}</li>
        </ul>
        <button type="button" className="legend-more" onClick={() => setOpen(true)} aria-expanded={false}>
          ⊞ {t('legend')}
        </button>
      </aside>
    );
  }
  return (
    <aside className="legendbox" aria-label={t('legend')}>
      <div className="panel-bar">
        <span className="panel-title">{t('legend')}</span>
        <button type="button" className="mini" onClick={() => setOpen(false)} aria-label={t('close')}>✕</button>
      </div>
      <div className="legend-scroll">
        <h4>{t('lg_terr')}</h4>
        <p className="meta">{t('lg_terrNote')}</p>
        {Object.keys(REGION).map((rid) => (
          <ul key={rid} className="terrkey">
            <li className="rname">{tl(REGION[rid].name)}</li>
            {ACTORS.filter((a) => a.region === rid).map((a) => (
              <li key={a.id}><i className="sw box" style={{ background: a.color }} />{a.short} <small>({t(`ak_${a.kind}`)})</small></li>
            ))}
          </ul>
        ))}
        <h4>{t('lg_status')}</h4>
        <ul>
          {(['tier4', 'tier3', 'tier2', 'tier1', 'ceasefire', 'flashpoint', 'historic'] as const).map((k) => (
            <li key={k}><i className="sw dot" style={{ background: STATUS_COLOR[k] }} />{t(k)}</li>
          ))}
        </ul>
        <h4>{t('lg_symbols')}</h4>
        <ul>
          <li><i className="sw dot" style={{ background: '#FF4545' }} />{t('sym_conflict')}</li>
          <li><i className="sw diamond" style={{ background: '#00D9FF' }} />{t('sym_choke')}</li>
          <li><i className="sw square" style={{ background: '#FF9B42' }} />{t('sym_site')}</li>
          <li><i className="sw hollow" />{t('sym_disputed')}</li>
          <li><i className="sw dot" style={{ background: '#EAF2FF' }} />{t('sym_place')}</li>
          <li><i className="sw line dot3" style={{ background: '#FFFFFF' }} />{t('sym_front')}</li>
          <li><i className="sw dot" style={{ background: EVENT_COLOR.political }} />{t('sym_event')}</li>
        </ul>
        <h4>{t('lg_routes')}</h4>
        <ul>
          {ROUTE_SW.map(({ key, c }) => (
            <li key={key}><i className={`sw line${key === 'rk_pipeline' ? '' : ' dash'}`} style={{ background: c }} />{t(key)} <small>({t(key === 'rk_pipeline' ? 'solid' : 'dashed')})</small></li>
          ))}
        </ul>
        <h4>{t('lg_links')}</h4>
        <p className="meta">{t('lg_linknote')}</p>
        <ul>
          <li><i className="sw line dash" style={{ background: '#EAF2FF' }} />{t('o_observed')} <small>({t('dashed')}, animert)</small></li>
          <li><i className="sw line shortdash" style={{ background: '#EAF2FF' }} />{t('o_assessed')} <small>({t('dashed')})</small></li>
          <li><i className="sw line dot3" style={{ background: '#EAF2FF' }} />{t('o_potential')} <small>({t('dotted')})</small></li>
        </ul>
        <ul className="cols">
          {LINK_TYPES.map((k) => (
            <li key={k}><i className="sw dot" style={{ background: REL_COLOR[k] }} />{t(`r_${k}` as 'r_defense')}</li>
          ))}
        </ul>
        <h4>{t('lg_attacks')}</h4>
        <p className="meta">{t('at_note')}</p>
        <ul className="cols">
          {CATEGORIES.map((k) => (
            <li key={k}><i className="sw dot" style={{ background: CATEGORY_COLOR[k] }} />{t(`ac_${k}` as 'ac_clash')}</li>
          ))}
        </ul>
        <ul>
          <li><i className="sw dot" style={{ background: '#EAF2FF' }} />{t('p_exact')}</li>
          <li><i className="sw box" style={{ background: '#EAF2FF' }} />{t('p_city')}</li>
        </ul>
        <h4>{t('lg_incidents')}</h4>
        <p className="meta">{t('inc_note')}</p>
        <p className="meta">{t('inc_height')}</p>
        <ul className="flowkey">
          <li><i className="sw box" style={{ background: 'rgba(255,214,120,.55)' }} />{t('lg_incFew')}</li>
          <li><i className="sw box" style={{ background: 'rgba(255,40,25,.85)' }} />{t('lg_incMany')}</li>
        </ul>
        <h4>{t('lg_flows')}</h4>
        <p className="meta">{t('flowWeightNote')}</p>
        <ul className="flowkey">
          <li><i className="sw line dash w3" style={{ background: REL_COLOR.displacement }} />{t('lg_flowBig')}</li>
          <li><i className="sw line dash w2" style={{ background: REL_COLOR.displacement }} />{t('lg_flowMid')}</li>
          <li><i className="sw line dash w1" style={{ background: REL_COLOR.displacement }} />{t('lg_flowSmall')}</li>
        </ul>
        <h4>{t('lg_events')}</h4>
        <ul className="cols">
          {EVENTS_T.map((k) => (
            <li key={k}><i className="sw dot" style={{ background: EVENT_COLOR[k] }} />{t(`ev_${k}` as 'ev_escalation')}</li>
          ))}
        </ul>
        <p className="meta legend-foot">{t('lg_decor')}</p>
      </div>
    </aside>
  );
}
