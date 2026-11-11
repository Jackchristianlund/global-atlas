import { CHOKEPOINT, ROUTE, SCENARIO, SCENARIOS } from '../data';
import { detour } from '../lib/selectors';
import { useStore } from '../store';
import { fmtNum, useT } from '../i18n';
import { ClaimRow, Empty, Section } from './bits';

/** Scenario Lab: documented exposure under stated assumptions. No forecasts, no probabilities. */
export default function ScenarioLab() {
  const { t, tl, lang } = useT();
  const { scenarioId, setScenario, knots, setKnots, select } = useStore();
  const sc = SCENARIO[scenarioId] ?? SCENARIOS[0];

  return (
    <article className="lab">
      <div className="hypo" role="note">{t('hypothetical')}</div>
      <header className="p-head">
        <div className="p-kicker">{t('v_scenario')}</div>
        <h2>{tl(sc.name)}</h2>
        <p className="note">{t('scenIntro')}</p>
      </header>

      <label className="field">
        <span>{t('v_scenario')}</span>
        <select value={sc.id} onChange={(e) => setScenario(e.target.value)}>
          {SCENARIOS.map((s) => <option key={s.id} value={s.id}>{tl(s.name)}</option>)}
        </select>
      </label>

      {sc.chokepoint && (
        <button type="button" className="rowbtn" onClick={() => select({ kind: 'chokepoint', id: sc.chokepoint! })}>
          {tl(CHOKEPOINT[sc.chokepoint].name)} →
        </button>
      )}

      <Section title={t('assumptions')}>
        <ul className="plain">{sc.assumptions.map((a, i) => <li key={i}>{tl(a)}</li>)}</ul>
      </Section>

      <Section title={t('documented')}>
        {sc.facts.length ? <ul className="claims">{sc.facts.map((c, i) => <ClaimRow key={i} c={c} />)}</ul> : <Empty>{t('naData')}</Empty>}
      </Section>

      <Section title={t('computed')}>
        {sc.detours.length === 0 ? (
          <Empty>{t('noDetour')}</Empty>
        ) : (
          <>
            <label className="field inline">
              <span>{t('speed')}: {knots} {t('knots')}</span>
              <input type="range" min={8} max={22} step={1} value={knots} onChange={(e) => setKnots(Number(e.target.value))} />
            </label>
            {sc.detours.map((d, i) => {
              const r = detour(ROUTE[d.base], ROUTE[d.alt], knots);
              return (
                <div className="detour" key={i}>
                  <h4>{tl(d.label)}</h4>
                  <table className="tbl">
                    <tbody>
                      <tr><td>{t('normal')}</td><td>{fmtNum(r.baseNm, lang)} {t('nm')}</td><td>{fmtNum(r.baseDays, lang, 1)} {t('days')}</td></tr>
                      <tr><td>{t('alt')}</td><td>{fmtNum(r.altNm, lang)} {t('nm')}</td><td>{fmtNum(r.altDays, lang, 1)} {t('days')}</td></tr>
                      <tr className="sumrow"><td>{t('extra')}</td><td>+{fmtNum(r.extraNm, lang)} {t('nm')} ({fmtNum(r.extraPct, lang, 0)} %)</td><td>+{fmtNum(r.extraDays, lang, 1)} {t('days')}</td></tr>
                    </tbody>
                  </table>
                  <div className="detour-btns">
                    <button type="button" className="mini" onClick={() => select({ kind: 'route', id: d.base })}>{t('normal')} →</button>
                    <button type="button" className="mini" onClick={() => select({ kind: 'route', id: d.alt })}>{t('alt')} →</button>
                  </div>
                </div>
              );
            })}
            <p className="note warn">{tl(ROUTE[sc.detours[0].base].note)}</p>
          </>
        )}
      </Section>

      <Section title={t('unknowns')}>
        <ul className="plain">{sc.unknowns.map((u, i) => <li key={i}>{tl(u)}</li>)}</ul>
      </Section>
    </article>
  );
}
