import { REL_COLOR } from '../data';
import { onwardLinks, traceLinks } from '../lib/trace';
import { useStore } from '../store';
import { fmtDate, useT } from '../i18n';
import { Src } from './bits';

/**
 * Follow one documented connection at a time. Each hop is itself a sourced link;
 * secondary connections stay hidden until the user expands them, and the chain
 * never claims causality beyond what each piece of evidence states.
 */
export default function TraceSection() {
  const { t, tl, lang } = useT();
  const { trace, pushTrace, popTrace, clearTrace } = useStore();
  const links = traceLinks(trace);
  if (!links.length) return null;
  const head = links[links.length - 1];
  const onward = onwardLinks(head.id).filter((l) => !trace.includes(l.id));
  return (
    <section className="trace" aria-label={t('trace_title')}>
      <div className="trace-head">
        <strong>{t('trace_title')}</strong>
        <span className="meta">{t('trace_step')} {links.length}</span>
      </div>
      <ol className="trace-path">
        {links.map((l, i) => (
          <li key={l.id} className={i === links.length - 1 ? 'on' : ''}>
            {tl(l.from.label)} → {tl(l.to.label)}
          </li>
        ))}
      </ol>
      <div className="link" style={{ ['--c' as string]: REL_COLOR[head.type] }}>
        <div className="link-tags">
          <span className="tag" style={{ color: REL_COLOR[head.type] }}>{t(`r_${head.type}`)}</span>
          <span className={`badge o-${head.kind}`}>{t(`o_${head.kind}`)}</span>
          <span className="meta">{t('conf')}: {t(`conf_${head.confidence}`)}</span>
          <time dateTime={head.d}>{fmtDate(head.d, lang)}</time>
          <Src ids={head.s} />
        </div>
        <p><span className="lbl">{t('evidence')}:</span> {tl(head.evidence)}</p>
        <p><span className="lbl">{t('mechanism')}:</span> {tl(head.mechanism)}</p>
      </div>
      <h4 className="trace-sub">{t('trace_onward')} ({onward.length})</h4>
      {onward.length === 0 && <p className="empty">{t('trace_none')}</p>}
      {onward.map((l) => (
        <button key={l.id} type="button" className="rowbtn" onClick={() => pushTrace(l.id)}>
          <span className="dot" style={{ background: REL_COLOR[l.type] }} />
          <span>{tl(l.to.label)} <small className="meta">· {t(`r_${l.type}`)} · {t(`o_${l.kind}`)}</small></span>
        </button>
      ))}
      <div className="trace-btns">
        {trace.length > 1 && <button type="button" className="mini" onClick={popTrace}>← {t('trace_back')}</button>}
        <button type="button" className="mini" onClick={clearTrace}>✕ {t('trace_end')}</button>
      </div>
      <p className="note">{t('trace_note')}</p>
    </section>
  );
}
