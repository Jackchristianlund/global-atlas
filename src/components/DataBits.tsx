import { ENERGY, SIPRI, UCDP_DEATHS, latest, type LiveMeta, type SeriesFile } from '../data/live';
import { fmtDate, fmtNum, useT } from '../i18n';
import { useStore } from '../store';
import type { Iso } from '../types';

/** Attribution line that accompanies every number drawn from an external dataset. */
export function LiveMetaLine({ meta }: { meta: LiveMeta }) {
  const { t, lang } = useT();
  return (
    <p className="livemeta">
      <a href={meta.url} target="_blank" rel="noopener noreferrer">{meta.attribution}</a>
      {' · '}{meta.vintage}
      {' · '}{t('ds_retrieved')} {fmtDate(meta.retrieved_at.slice(0, 10), lang)}
    </p>
  );
}

function Row({ label, value, year, f }: { label: string; value: string; year: number; f: SeriesFile }) {
  return (
    <li className="fig">
      <div className="fig-l">{label}</div>
      <div className="fig-v">{value} <span className="meta">({year})</span></div>
      <div className="fig-m"><LiveMetaLine meta={f.meta} /></div>
    </li>
  );
}

/** Country figures from the integrated external datasets, each with vintage and attribution. */
export function ExtSeries({ code }: { code: Iso }) {
  const { t, lang } = useT();
  const setModal = useStore((s) => s.setModal);
  const rows: React.ReactNode[] = [];

  const gdp = latest(SIPRI, code, 'milex_share_gdp');
  const usd = latest(SIPRI, code, 'milex_usd');
  const cap = latest(SIPRI, code, 'milex_per_capita');
  if (gdp || usd) {
    const parts = [
      gdp ? `${fmtNum(gdp.v, lang, 2)} % ${t('ext_gdp')}` : null,
      usd ? `${fmtNum(usd.v / 1e9, lang, 1)} ${t('bnUsd')}` : null,
      cap ? `${fmtNum(cap.v, lang, 0)} USD ${t('ext_percap')}` : null,
    ].filter(Boolean);
    rows.push(<Row key="m" label={t('ext_milex')} value={parts.join(' · ')} year={(gdp ?? usd)!.year} f={SIPRI} />);
  }
  const deaths = latest(UCDP_DEATHS, code, 'deaths');
  if (deaths) rows.push(<Row key="d" label={t('ext_deaths')} value={fmtNum(deaths.v, lang)} year={deaths.year} f={UCDP_DEATHS} />);
  const oil = latest(ENERGY, code, 'oil_prod_twh');
  if (oil && oil.v > 0) rows.push(<Row key="o" label={t('ext_oil')} value={`${fmtNum(oil.v, lang)} TWh`} year={oil.year} f={ENERGY} />);
  const gas = latest(ENERGY, code, 'gas_prod_twh');
  if (gas && gas.v > 0) rows.push(<Row key="g" label={t('ext_gas')} value={`${fmtNum(gas.v, lang)} TWh`} year={gas.year} f={ENERGY} />);

  return (
    <>
      <p className="note">{t('ext_note')} <button type="button" className="mini" onClick={() => setModal('data')}>{t('ds_title')}</button></p>
      {rows.length ? <ul className="figs">{rows}</ul> : <p className="empty">{t('ext_none')}</p>}
    </>
  );
}
