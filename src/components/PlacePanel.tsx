import { ATTACKS } from '../data/attacks';
import { ACTOR, REGION } from '../data/territory';
import { haversineKm } from '../lib/geo';
import { PLACE, placeControlAt, territoryById } from '../lib/territory';
import { useStore } from '../store';
import { fmtDate, useT } from '../i18n';
import { Empty, Section, SourceList, Src } from './bits';
import { AttackList } from './AttackPanel';

/** How close an incident must be to count as "recorded here". */
const NEAR_KM = 40;

/**
 * A city or site: who holds it, how that changed, and what the incident record
 * places nearby.
 *
 * Proximity is stated rather than implied — an incident listed here happened
 * within 40 km of the place, which is not the same as happening in it. And a
 * place appearing in the list is not a claim that fighting is going on there.
 */
export default function PlacePanel({ id }: { id: string }) {
  const { t, tl, lang } = useT();
  const { year, select } = useStore();
  const p = PLACE[id];
  if (!p) return <Empty>{t('naData')}</Empty>;
  const now = placeControlAt(id, year);
  const a = now?.actor ? ACTOR[now.actor] : null;
  const reg = REGION[p.region];
  const unit = p.unit ? territoryById(p.unit, year) : null;
  const near = ATTACKS
    .filter((x) => Number(x.d.slice(0, 4)) <= year && haversineKm(x.at, p.at) <= NEAR_KM)
    .sort((x, y) => y.d.localeCompare(x.d));
  return (
    <article>
      <header className="p-head">
        <div className="p-kicker">
          <span className="dot lg" style={{ background: a?.color ?? '#B8C7DA' }} />
          {t('pl_title')}{reg ? ` · ${tl(reg.name)}` : ''}
        </div>
        <h2>{p.name}</h2>
        <dl className="kv">
          <div><dt>{t('pl_control')}</dt><dd>{a ? a.short : <span className="na">{t('pl_contested')}</span>}</dd></div>
          <div><dt>{t('lastVerified')}</dt><dd>{fmtDate(now?.from ?? p.d, lang)}</dd></div>
          <div><dt>{t('year')}</dt><dd>{year}</dd></div>
        </dl>
      </header>
      <Section title={t('sum')}><p>{tl(p.note)} <Src ids={p.s} /></p></Section>
      {unit && (
        <Section title={t('pl_unit')}>
          <button type="button" className="chip" onClick={() => select({ kind: 'territory', id: unit.properties.id })}>
            {unit.properties.unitName}
          </button>
        </Section>
      )}
      <Section title={t('pl_history')}>
        {p.history?.length ? (
          <ul className="histlist">
            {p.history.map((h, i) => (
              <li key={i}>
                <span className="hist-when"><time dateTime={h.from}>{fmtDate(h.from, lang)}</time></span>
                <span className="hist-what">
                  {h.actor ? <><span className="dot" style={{ background: ACTOR[h.actor].color }} />{ACTOR[h.actor].short} · </> : null}
                  {tl(h.what)} <Src ids={h.s} />
                </span>
              </li>
            ))}
          </ul>
        ) : <Empty>{t('pl_noHistory')}</Empty>}
      </Section>
      <Section title={`${t('pl_events')} · ${near.length}`}>
        {near.length ? <><AttackList items={near} /><p className="note">{t('pl_near')}</p></> : <Empty>{t('pl_noEvents')}</Empty>}
      </Section>
      <Section title={t('method')}><p className="note">{t('pl_notFighting')}</p></Section>
      <Section title={t('sources')}>
        <SourceList ids={Array.from(new Set([...p.s, ...(p.history ?? []).flatMap((h) => h.s)]))} />
      </Section>
    </article>
  );
}
