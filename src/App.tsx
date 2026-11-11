import { Suspense, lazy } from 'react';
import GlobeView from './components/GlobeView';
import Legend from './components/Legend';
import FrontlineTicket from './components/FrontlineTicket';
import Header from './components/Header';
import LeftSidebar from './components/LeftSidebar';
import Modals from './components/Modals';
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

export default function App() {
  const mapMode = useStore((s) => s.mapMode);
  const lowPower = useStore((s) => s.lowPower);
  const { t } = useT();
  return (
    <div className={lowPower ? 'app lowpower' : 'app'}>
      <Header />
      <div className="mid">
        <LeftSidebar />
        <main className="stage">
          {/* The globe stays mounted while the map is open: its textures and
              geometry are expensive to rebuild, and coming back should be
              instant rather than a second loading screen. */}
          <div className={mapMode === 'globe' ? 'viewlayer on' : 'viewlayer'}>
            <GlobeView />
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
      <Modals />
    </div>
  );
}
