import { Suspense, lazy } from 'react';
import Legend from './components/Legend';
import FrontlineTicket from './components/FrontlineTicket';
import Header from './components/Header';
import LeftSidebar from './components/LeftSidebar';
import RightPanel from './components/RightPanel';
import Timeline from './components/Timeline';
import ViewSwitch from './components/ViewSwitch';
import { useStore } from './store';
import { useT } from './i18n';

/**
 * MapLibre and its style machinery are a large dependency and only the
 * detailed map needs them, so they load the first time someone opens that
 * view rather than on every visit to the globe.
 */
const RegionMap = lazy(() => import('./map/RegionMap'));

/**
 * The globe is three.js, three-globe and their geometry helpers: about half
 * of everything the page downloads. Split out, the header, panels and
 * timeline appear while it is still arriving, instead of the whole page
 * waiting on it. The request starts at once, in parallel with the rest.
 */
const globeChunk = import('./components/GlobeView');
const GlobeView = lazy(() => globeChunk);

/** Dialogs load the first time one is opened. */
const Modals = lazy(() => import('./components/Modals'));

export default function App() {
  const mapMode = useStore((s) => s.mapMode);
  const leftCollapsed = useStore((s) => s.leftCollapsed);
  const rightCollapsed = useStore((s) => s.rightCollapsed);
  const setCollapsed = useStore((s) => s.setCollapsed);
  const lowPower = useStore((s) => s.lowPower);
  const modal = useStore((s) => s.modal);
  const { t } = useT();
  return (
    <div className={lowPower ? 'app lowpower' : 'app'}>
      <Header />
      <div className={`mid${leftCollapsed ? ' lc' : ''}${rightCollapsed ? ' rc' : ''}`}>
        {leftCollapsed && (
          <button type="button" className="edge-tab left" onClick={() => setCollapsed('left', false)} aria-label={t('showFilters')} title={t('showFilters')}>
            <span aria-hidden="true">›</span>{t('filters')}
          </button>
        )}
        {rightCollapsed && (
          <button type="button" className="edge-tab right" onClick={() => setCollapsed('right', false)} aria-label={t('showPanel')} title={t('showPanel')}>
            {t('panel')}<span aria-hidden="true">‹</span>
          </button>
        )}
        <LeftSidebar />
        <main className="stage">
          {/* The globe stays mounted while the map is open: its textures and
              geometry are expensive to rebuild, and coming back should be
              instant rather than a second loading screen. */}
          <div className={mapMode === 'globe' ? 'viewlayer on' : 'viewlayer'}>
            <Suspense fallback={<div className="globeloading" role="status"><span>{t('loading')}</span></div>}>
              <GlobeView />
            </Suspense>
          </div>
          {mapMode === 'map' && (
            <div className="viewlayer on">
              <Suspense fallback={<div className="maploading">{t('loading')}</div>}>
                <RegionMap />
              </Suspense>
            </div>
          )}
          <ViewSwitch />
          <Legend />
          <FrontlineTicket />
        </main>
        <RightPanel />
      </div>
      <Timeline />
      {modal && <Suspense fallback={null}><Modals /></Suspense>}
    </div>
  );
}
