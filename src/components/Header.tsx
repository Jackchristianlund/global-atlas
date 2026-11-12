import { useEffect, useMemo, useRef, useState } from 'react';
import { ALL_ROUTES, CHOKEPOINTS, CONFLICTS, COUNTRY_CODES, ENERGY_SITES, ORGS, SNAPSHOT_DATE, countryName } from '../data';
import { matches } from '../lib/selectors';
import { ACTORS, PLACES } from '../data/territory';
import { territoryFeatures } from '../lib/territory';
import { FLOWS } from '../data/displacement';
import { useStore } from '../store';
import { fmtDate, pick, useT } from '../i18n';
import type { Selection, ViewId } from '../types';
import { shareUrl } from '../urlSync';

const VIEWS: ViewId[] = ['conflict', 'alliance', 'trade', 'energy', 'human', 'history', 'scenario'];

interface Hit { label: string; kind: string; sel: Selection; at?: [number, number] }

type GazRow = [string, number, number, string, number];
let gazetteer: GazRow[] | null = null;
/** The city list loads the first time someone uses the search box, not on every visit. */
function loadGazetteer(): Promise<GazRow[]> {
  if (gazetteer) return Promise.resolve(gazetteer);
  return import('../data/gazetteer.json').then((m) => (gazetteer = (m.default as unknown as GazRow[])));
}

/** What the box offers before anything is typed: the two regional explorers and their key places. */
const SUGGEST: { sel: NonNullable<Selection> }[] = [
  { sel: { kind: 'conflict', id: 'ukr' } },
  { sel: { kind: 'conflict', id: 'yem' } },
  { sel: { kind: 'place', id: 'p-kharkiv' } },
  { sel: { kind: 'place', id: 'p-aden' } },
  { sel: { kind: 'chokepoint', id: 'bab' } },
  { sel: { kind: 'country', id: 'SDN' } },
];

export default function Header() {
  const { t, lang } = useT();
  const s = useStore();
  const [q, setQ] = useState('');
  const [focus, setFocus] = useState(false);
  const [active, setActive] = useState(0);
  const [cities, setCities] = useState<GazRow[] | null>(gazetteer);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (focus && !cities) void loadGazetteer().then(setCities); }, [focus, cities]);

  const all: Hit[] = useMemo(() => {
    const out: Hit[] = [];
    for (const c of CONFLICTS) out.push({ label: pick(c.name, lang), kind: t('v_conflict'), sel: { kind: 'conflict', id: c.id } });
    for (const c of CHOKEPOINTS) out.push({ label: pick(c.name, lang), kind: t('l_chokepoints'), sel: { kind: 'chokepoint', id: c.id } });
    for (const r of ALL_ROUTES) out.push({ label: pick(r.name, lang), kind: t(`rk_${r.kind}`), sel: { kind: 'route', id: r.id } });
    for (const o of ORGS) out.push({ label: `${o.short} · ${pick(o.name, lang)}`, kind: t('orgs'), sel: { kind: 'org', id: o.id } });
    for (const e of ENERGY_SITES) out.push({ label: e.name, kind: t(`sk_${e.kind}`), sel: { kind: 'site', id: e.id } });
    for (const c of COUNTRY_CODES) out.push({ label: countryName(c, lang), kind: t('country'), sel: { kind: 'country', id: c } });
    // Territorial units and the actors that hold them: searchable by their own
    // names, so a region like Abkhazia or Chechnya can be reached by name
    // rather than only by finding it on the globe.
    for (const a of ACTORS) out.push({ label: pick(a.name, lang), kind: t(`ak_${a.kind}` as 'ak_government'), sel: { kind: 'actor', id: a.id } });
    for (const u of territoryFeatures()) out.push({ label: u.properties.unitName, kind: t('terr_unit'), sel: { kind: 'territory', id: u.properties.id } });
    for (const p of PLACES) out.push({ label: p.name, kind: t('pl_title'), sel: { kind: 'place', id: p.id } });
    for (const f of FLOWS) out.push({ label: `${countryName(f.from, lang)} \u2192 ${countryName(f.to, lang)}`, kind: t('flow'), sel: { kind: 'flow', id: f.id } });
    return out;
  }, [lang, t]);

  const suggestions: Hit[] = useMemo(() => SUGGEST.map(({ sel }) => all.find((h) => h.sel?.kind === sel.kind && h.sel.id === sel.id)).filter((h): h is Hit => !!h), [all]);
  const hits = useMemo(() => {
    if (q.trim().length < 2) return [];
    const own = all.filter((h) => matches(h.label, q));
    // Cities from the gazetteer, after the atlas's own records and never
    // duplicating a place the atlas already carries.
    const known = new Set(own.map((h) => h.label.toLowerCase()));
    const city: Hit[] = (cities ?? [])
      .filter((r) => matches(r[0], q) && !known.has(r[0].toLowerCase()))
      .slice(0, 6)
      .map((r) => ({ label: r[0], kind: `${t('sr_city')}${r[3] ? ` · ${r[3]}` : ''}`, sel: null, at: [r[1], r[2]] }));
    return [...own.slice(0, 12 - Math.min(city.length, 4)), ...city].slice(0, 12);
  }, [q, all, cities, t]);
  const shown = q.trim().length >= 2 ? hits : suggestions;
  useEffect(() => setActive(0), [q]);

  // Everything the query matches, not just the twelve shown in the dropdown:
  // the globe dims the rest, and a marker that matched would look wrong going
  // dark only because it fell off the end of a list.
  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) { s.setSearch('', new Set()); return; }
    const keys = new Set<string>();
    for (const h of all) {
      if (!h.sel || !matches(h.label, q)) continue;
      keys.add(`${h.sel.kind}:${h.sel.id}`);
    }
    s.setSearch(query, keys);
    // `s` is the whole store; depending on it would re-run this on every change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, all]);

  const go = (h: Hit) => {
    if (!h.sel && h.at) {
      // A city with no record of its own: just take the camera there.
      const [lat, lng] = h.at;
      s.frameArea([lng - 0.35, lat - 0.25, lng + 0.35, lat + 0.25]);
      setQ('');
      s.setSearch('', new Set());
      inputRef.current?.blur();
      return;
    }
    s.select(h.sel);
    if (h.sel?.kind === 'org') s.setOrg(h.sel.id);
    setQ('');
    s.setSearch('', new Set());
    inputRef.current?.blur();
  };

  return (
    <header className="hdr">
      <div className="brand">
        <button type="button" className="mini only-mobile" onClick={() => s.setLeftOpen(!s.leftOpen)} aria-label={t('filters')}>☰</button>
        <svg className="logo" viewBox="0 0 32 32" aria-hidden>
          <circle cx="16" cy="16" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <ellipse cx="16" cy="16" rx="4.6" ry="10.5" fill="none" stroke="currentColor" strokeWidth="1" opacity=".7" />
          <path d="M5.5 16h21M7.4 10.6h17.2M7.4 21.4h17.2" stroke="currentColor" strokeWidth="1" opacity=".55" fill="none" />
          <path d="M2.6 20.5a14.5 14.5 0 0 0 26.8 0" fill="none" stroke="#FF9B42" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="29.4" cy="20.5" r="1.7" fill="#FF9B42" />
        </svg>
        <div>
          <h1>GLOBAL ATLAS</h1>
          <span className="tagline">{t('appTagline')}</span>
        </div>
      </div>

      <nav className="views" aria-label={t('overview')}>
        {VIEWS.map((v) => (
          <button key={v} type="button" className={s.view === v ? 'on' : ''} aria-pressed={s.view === v} onClick={() => s.setView(v)}>
            {t(`v_${v}`)}
          </button>
        ))}
      </nav>

      <div className="hdr-right">
        <div className="search" role="search">
          <input
            ref={inputRef}
            type="search"
            placeholder={t('searchPh')}
            aria-label={t('search')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => window.setTimeout(() => setFocus(false), 150)}
            role="combobox" aria-expanded={focus} aria-controls="search-dd" aria-autocomplete="list"
            aria-activedescendant={focus && shown[active] ? `sr-${active}` : undefined}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, shown.length - 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              else if (e.key === 'Enter' && shown[active]) go(shown[active]);
              else if (e.key === 'Escape') { setQ(''); inputRef.current?.blur(); }
            }}
          />
          {focus && (
            <ul className="search-dd" role="listbox" id="search-dd">
              {q.trim().length < 2 && <li className="dd-head">{t('sr_suggest')}</li>}
              {q.trim().length >= 2 && hits.length === 0 && <li className="empty">{t('noHits')}</li>}
              {shown.map((h, i) => (
                <li key={i} id={`sr-${i}`} role="option" aria-selected={i === active}>
                  <button type="button" className={i === active ? 'act' : ''} onMouseEnter={() => setActive(i)} onMouseDown={(e) => { e.preventDefault(); go(h); }}>
                    <span>{h.label}</span><small>{h.kind}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button" className="fresh" onClick={() => s.setModal('data')}
          title={`${t('snapshot')} ${fmtDate(SNAPSHOT_DATE, lang)} · ${t('notRealtime')} — ${t('ds_title')}`}
          aria-label={`${t('snapshot')} ${fmtDate(SNAPSHOT_DATE, lang)}, ${t('notRealtime')}. ${t('ds_title')}`}
        >
          <span className="fresh-dot" aria-hidden />
          {fmtDate(SNAPSHOT_DATE, lang)} · {t('notRealtime')}
        </button>

        <button
          type="button" className={`mini sharebtn${copied ? ' on' : ''}`} title={t('sh_hint')}
          onClick={() => {
            const url = shareUrl();
            const done = () => { setCopied(true); window.setTimeout(() => setCopied(false), 1800); };
            try { void navigator.clipboard?.writeText(url).then(done, () => { window.prompt(t('sh_copy'), url); }); }
            catch { window.prompt(t('sh_copy'), url); }
          }}
        >
          {copied ? `✓ ${t('sh_copied')}` : `⤴ ${t('sh_copy')}`}
        </button>

        <button
          type="button" className={`mini gfxbtn${s.lowPower ? ' on' : ''}`}
          onClick={() => s.setLowPower(!s.lowPower)}
          aria-pressed={s.lowPower} title={t('lowPowerHint')}
        >
          {t('lowPowerShort')}
        </button>

        <button type="button" className={`mini tierbtn${s.tier === 'pro' ? ' on' : ''}`} onClick={() => s.setModal('pricing')}>
          {s.tier === 'pro' ? t('pr_pro') : t('pro_see')}
        </button>

        <div className="langs" role="group" aria-label={t('language')}>
          <button type="button" className={lang === 'no' ? 'on' : ''} aria-pressed={lang === 'no'} onClick={() => s.setLang('no')}>NO</button>
          <button type="button" className={lang === 'en' ? 'on' : ''} aria-pressed={lang === 'en'} onClick={() => s.setLang('en')}>EN</button>
        </div>

        <button type="button" className="mini only-mobile" onClick={() => s.setRightOpen(!s.rightOpen)} aria-label={t('panel')}>ⅈ</button>
      </div>
    </header>
  );
}
