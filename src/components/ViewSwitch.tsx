import { useState } from 'react';
import { MAP_STYLES, STYLE_ORDER, altitudeToZoom, styleAvailable, zoomToAltitude } from '../map/styles';
import type { LabelDensity } from '../map/overlays';
import { useStore } from '../store';
import { CONFLICT } from '../data';
import { REGION_FOR_CONFLICT } from '../lib/territory';
import { useT } from '../i18n';
import SnapshotButton from './SnapshotButton';

const DENSITIES: LabelDensity[] = ['low', 'normal', 'high'];

/**
 * The globe/map switch and the base-map controls.
 *
 * Switching views carries the camera across: the globe's altitude becomes the
 * map's zoom and back again, so the same ground stays in the middle at the
 * same scale. The year, the layers and the selection are shared state already,
 * so they need no carrying — which is the point of putting the map on the same
 * store rather than building a second application.
 */
export default function ViewSwitch() {
  const { t, tl } = useT();
  const { mapMode, setMapMode, mapStyle, setMapStyle, labelDensity, setLabelDensity, mapView, setMapView, globeView } = useStore();

  const toMap = () => {
    // The globe reports where it is looking; the map opens there.
    setMapView({ lat: globeView.lat, lng: globeView.lng, zoom: altitudeToZoom(globeView.altitude) });
    setMapMode('map');
  };
  const toGlobe = () => {
    useStore.getState().setGlobeView({ lat: mapView.lat, lng: mapView.lng, altitude: zoomToAltitude(mapView.zoom) });
    setMapMode('globe');
  };

  // Straight to a war: select it, so its explorer opens in the panel, and
  // open the detailed map framed on the units that carry its control records.
  const sel = useStore((x) => x.sel);
  // The style controls fold away on a phone, where they would cover a third
  // of the map; on a desktop they start open.
  const [styleOpen, setStyleOpen] = useState(() => typeof window === 'undefined' || window.innerWidth > 880);
  const go = (id: 'ukr' | 'yem') => {
    const c = CONFLICT[id];
    useStore.getState().select({ kind: 'conflict', id });
    useStore.getState().openDetail(c.iso, c.at, REGION_FOR_CONFLICT[id]);
  };

  return (
    <div className="viewswitch">
      <div className="vs-row">
        <div className="vs-modes" role="group" aria-label={t('mm_switch')}>
          <button type="button" className={mapMode === 'globe' ? 'on' : ''} aria-pressed={mapMode === 'globe'} onClick={toGlobe}>{t('mm_globe')}</button>
          <button type="button" className={mapMode === 'map' ? 'on' : ''} aria-pressed={mapMode === 'map'} onClick={toMap}>{t('mm_map')}</button>
        </div>
        <div className="vs-modes vs-quick" role="group" aria-label={t('qn_title')}>
          {(['ukr', 'yem'] as const).map((id) => {
            const on = sel?.kind === 'conflict' && sel.id === id;
            return (
              <button key={id} type="button" className={on ? 'on' : ''} aria-pressed={on} onClick={() => go(id)}>
                {t(id === 'ukr' ? 'qn_ukraine' : 'qn_yemen')}
              </button>
            );
          })}
        </div>
        <div className="vs-modes"><SnapshotButton /></div>
      </div>
      {mapMode === 'map' && !styleOpen && (
        <button type="button" className="vs-modes vs-stylebtn" onClick={() => setStyleOpen(true)} aria-expanded={false}>
          {t('ms_title')}: {tl(MAP_STYLES[mapStyle].label)} ▾
        </button>
      )}
      {mapMode === 'map' && styleOpen && (
        <div className="vs-map">
          <button type="button" className="mini vs-close" onClick={() => setStyleOpen(false)} aria-label={t('close')}>▴</button>
          <label className="vs-field">
            <span>{t('ms_title')}</span>
            <select value={mapStyle} onChange={(e) => setMapStyle(e.target.value as typeof mapStyle)}>
              {STYLE_ORDER.map((id) => (
                <option key={id} value={id}>
                  {tl(MAP_STYLES[id].label)}{styleAvailable(id) ? '' : ` — ${t('ms_needsKey')}`}
                </option>
              ))}
            </select>
          </label>
          <label className="vs-field">
            <span>{t('ld_title')}</span>
            <select value={labelDensity} onChange={(e) => setLabelDensity(e.target.value as LabelDensity)}>
              {DENSITIES.map((d) => <option key={d} value={d}>{t(`ld_${d}` as 'ld_low')}</option>)}
            </select>
          </label>
          <p className="vs-note">{t('ms_basemapNote')}</p>
        </div>
      )}
    </div>
  );
}
