import { CONFLICT, countryName } from '../data';
import type { Attack } from '../data/attacks';
import { ATTACK, CATEGORY_COLOR, attacksIn, reportingDelay } from '../lib/attacks';
import { territoryById } from '../lib/territory';
import { useStore } from '../store';
import { fmtDate, useT } from '../i18n';
import { ClaimRow, ConflictLink, CountryChip, Empty, Section, SourceList, Src } from './bits';

/** One documented incident, with every field the record actually carries. */
export function AttackPanel({ id }: { id: string }) {
  const { t, tl, lang } = useT();
  const select = useStore((s) => s.select);
  const year = useStore((s) => s.year);
  const a: Attack | undefined = ATTACK[id];
  if (!a) return <Empty>{t('naData')}</Empty>;
  const delay = reportingDelay(a);
  const unit = a.territory ? territoryById(a.territory, year) : null;
  const near = attacksIn({ conflict: a.conflict }).filter((x) => x.id !== a.id).slice(0, 4);
  return (
    <article>
      <header className="p-head">
        <div className="p-kicker">
          <span className="dot lg" style={{ background: CATEGORY_COLOR[a.category] }} />
          {t(`ac_${a.category}` as 'ac_clash')} · {countryName(a.iso, lang)}
        </div>
        <h2>{tl(a.title)}</h2>
        <p className="note">
          <b>{t('at_when')}:</b> <time dateTime={a.d}>{fmtDate(a.d, lang)}</time>{' · '}
          <b>{t('at_published')}:</b> <time dateTime={a.published}>{fmtDate(a.published, lang)}</time>
          {' · '}{delay === 0 ? t('at_sameDay') : `${t('at_delay')}: ${delay} ${t('at_days')}`}
        </p>
        <p className={`badge v-${a.verification}`}>{t(`v_${a.verification}` as 'v_confirmed')}</p>
      </header>
      <Section title={t('at_what')}><p>{tl(a.what)} <Src ids={a.s} /></p></Section>
      <Section title={t('at_where')}>
        <p>{tl(a.place)} <span className="meta">{Math.abs(a.at[0]).toFixed(2)}°{a.at[0] >= 0 ? 'N' : 'S'} {Math.abs(a.at[1]).toFixed(2)}°{a.at[1] >= 0 ? 'E' : 'W'}</span></p>
        <p className="note"><b>{t('at_precision')}:</b> {t(`p_${a.precision}` as 'p_city')}</p>
      </Section>
      <Section title={t('at_attacker')}>
        {a.attacker ? <p>{tl(a.attacker)}</p> : <Empty>{t('naData')}</Empty>}
        {a.target && <p className="note"><b>{t('at_target')}:</b> {tl(a.target)}</p>}
      </Section>
      <Section title={t('at_cas')}>
        {a.casualties.length ? <ul className="claims">{a.casualties.map((c, i) => <ClaimRow key={i} c={c} />)}</ul> : <Empty>{t('naData')}</Empty>}
      </Section>
      <Section title={t('at_damage')}>{a.damage ? <p>{tl(a.damage)}</p> : <Empty>{t('naData')}</Empty>}</Section>
      <Section title={t('at_civ')}>{a.civilian ? <p>{tl(a.civilian)}</p> : <Empty>{t('naData')}</Empty>}</Section>
      <Section title={t('v_conflict')}>
        <ul className="plain"><ConflictLink id={a.conflict} /></ul>
        <div className="chips"><CountryChip iso={a.iso} /></div>
      </Section>
      <Section title={t('at_terr')}>
        {unit ? (
          <>
            <button type="button" className="chip" onClick={() => select({ kind: 'territory', id: unit.properties.id })}>
              {unit.properties.unitName}
            </button>
            <p className="note">{t('at_note')}</p>
          </>
        ) : <><Empty>{t('naData')}</Empty><p className="note">{t('at_note')}</p></>}
      </Section>
      {near.length > 0 && (
        <Section title={`${t('rd_title')} · ${CONFLICT[a.conflict] ? tl(CONFLICT[a.conflict].name) : ''}`}>
          <AttackList items={near} />
        </Section>
      )}
      <Section title={t('sources')}><SourceList ids={Array.from(new Set([...a.s, ...a.casualties.flatMap((c) => c.s)]))} /></Section>
    </article>
  );
}

/** Compact list used by the panel and by Recent Developments. */
export function AttackList({ items }: { items: Attack[] }) {
  const { t, tl, lang } = useT();
  const select = useStore((s) => s.select);
  if (!items.length) return <Empty>{t('rd_none')}</Empty>;
  return (
    <ul className="atlist">
      {items.map((a) => (
        <li key={a.id} style={{ ['--c' as string]: CATEGORY_COLOR[a.category] }}>
          <button type="button" onClick={() => select({ kind: 'attack', id: a.id })}>
            <span className="at-date"><time dateTime={a.d}>{fmtDate(a.d, lang)}</time></span>
            <span className="at-title">{tl(a.title)}</span>
            <span className="at-meta">
              {t(`ac_${a.category}` as 'ac_clash')} · {countryName(a.iso, lang)} · {t(`v_${a.verification}` as 'v_confirmed')}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
