import { AUDIENCE_STATS, BILLING_ENABLED, FREE_FEATURES, PRICE, PRO_FEATURES, showAds, type AdSlot } from '../lib/entitlement';
import { useStore } from '../store';
import { useT } from '../i18n';
import { Section } from './bits';

/**
 * A labelled advertising slot. It sits inside a side panel, below the content,
 * never over the globe, a front line, a marker or an event description, and it
 * does not render for Pro.
 */
export function Ad({ slot }: { slot: AdSlot }) {
  const { t } = useT();
  const tier = useStore((s) => s.tier);
  if (!showAds(tier)) return null;
  return (
    <aside className={`adslot ad-${slot}`} aria-label={t('ad_label')}>
      <span className="ad-tag">{t('ad_label')}</span>
      <p className="ad-body">{t('ad_empty')}</p>
    </aside>
  );
}

/** Free and Pro side by side, with each feature marked live or planned. */
export function Pricing() {
  const { t, tl } = useT();
  const { tier, setTier } = useStore();
  return (
    <>
      <h2>{t('pr_title')}</h2>
      <p className="note">{t('pr_note')}</p>
      {!BILLING_ENABLED && <p className="note warn">{t('pr_nobilling')}</p>}
      <div className="tiers">
        <section className="tierbox">
          <h3>{t('pr_free')}</h3>
          <p className="tier-price">$0</p>
          <ul className="plain">
            {FREE_FEATURES.map((f) => <li key={f.id}>{tl(f.label)}</li>)}
          </ul>
          <p className="note">{t('pr_freeNote')}</p>
        </section>
        <section className="tierbox">
          <h3>{t('pr_pro')}</h3>
          <p className="tier-price">{PRICE.monthly.display}<small>/{t('pr_month')}</small></p>
          <p className="note">{PRICE.annual.display} / {t('pr_year')}</p>
          <ul className="plain">
            {PRO_FEATURES.map((f) => (
              <li key={f.id}>
                {tl(f.label)} <span className={`badge st-${f.state}`}>{t(f.state === 'live' ? 'pr_live' : 'pr_planned')}</span>
              </li>
            ))}
          </ul>
          <p className="note">{t('pr_plannedNote')}</p>
        </section>
      </div>
      <Section title={t('pr_preview')}>
        <p className="note">{t('pr_previewNote')}</p>
        <div className="chips">
          <button type="button" className={`chip${tier === 'free' ? ' on' : ''}`} aria-pressed={tier === 'free'} onClick={() => setTier('free')}>{t('pr_free')}</button>
          <button type="button" className={`chip${tier === 'pro' ? ' on' : ''}`} aria-pressed={tier === 'pro'} onClick={() => setTier('pro')}>{t('pr_pro')}</button>
        </div>
      </Section>
    </>
  );
}

/** The "Advertise with GLOBAL ATLAS" page. */
export function Advertise() {
  const { t, tl } = useT();
  return (
    <>
      <h2>{t('ad_title')}</h2>
      <p>{t('ad_intro')}</p>
      <Section title={t('ad_formats')}>
        <ul className="plain">
          <li>{t('ad_f1')}</li>
          <li>{t('ad_f2')}</li>
          <li>{t('ad_f3')}</li>
        </ul>
        <p className="note">{t('ad_never')}</p>
      </Section>
      <Section title={t('ad_audience')}>
        <ul className="figs">
          {AUDIENCE_STATS.map((x, i) => (
            <li key={i} className="fig">
              <div className="fig-l">{tl(x.metric)}</div>
              <div className="fig-v na">{tl(x.value)}</div>
            </li>
          ))}
        </ul>
        <p className="note">{t('ad_noStats')}</p>
      </Section>
      <Section title={t('ad_rules')}>
        <ul className="plain">
          <li>{t('ad_r1')}</li>
          <li>{t('ad_r2')}</li>
          <li>{t('ad_r3')}</li>
        </ul>
      </Section>
      <Section title={t('ad_contact')}>
        <p className="note">{t('ad_contactNote')}</p>
      </Section>
    </>
  );
}
