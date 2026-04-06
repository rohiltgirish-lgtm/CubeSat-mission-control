import { ReactNode, useEffect, useMemo, useState } from 'react';
import { DashboardPage } from './components/DashboardPage';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { VisualizationPage } from './components/VisualizationPage';
import { AlertsFeed } from './components/AlertsFeed';
import { AnomalyDetectionPanel } from './components/AnomalyDetectionPanel';
import { AnomalyScenarioPanel } from './components/AnomalyScenarioPanel';
import { CollisionRiskPanel } from './components/CollisionRiskPanel';
import { LiveTelemetryGraph } from './components/LiveTelemetryGraph';
import { SatelliteStatusCard } from './components/SatelliteStatusCard';
import { Badge } from './components/ui/Badge';
import { Card } from './components/ui/Card';
import { satelliteStatus, spaceObjects } from './data/mockData';
import { useTelemetrySimulation } from './hooks/useTelemetrySimulation';
import { useDebrisCollisionScan } from './hooks/useDebrisCollisionScan';
import { SpaceObject, SystemStatus } from './types';

const views = ['Dashboard', 'Telemetry', 'Collision Alerts', '3D Visualization', 'Satellites', 'Settings'] as const;
type View = (typeof views)[number];

function getSystemStatus(anomalyScore: number): SystemStatus {
  if (anomalyScore < 45) {
    return 'Connected';
  }
  if (anomalyScore < 72) {
    return 'Warning';
  }
  return 'Critical';
}

export default function App() {
  const [activeView, setActiveView] = useState<View>('Dashboard');
  const [navOpen, setNavOpen] = useState(false);
  const [booting, setBooting] = useState(true);
  const { telemetry, alerts, anomalyScore, isAnomaly, modelDetails, modelUpdatedAt } = useTelemetrySimulation();
  const { scan: collisionScan } = useDebrisCollisionScan();

  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), 1400);
    return () => window.clearTimeout(timer);
  }, []);

  const systemStatus = useMemo(() => getSystemStatus(anomalyScore), [anomalyScore]);

  const satellites = spaceObjects.filter((object) => object.type === 'satellite');

  const contentByView: Record<View, ReactNode> = {
    Dashboard: (
      <DashboardPage
        satellite={satelliteStatus}
        telemetry={telemetry}
        anomalyScore={anomalyScore}
        isAnomaly={isAnomaly}
        modelDetails={modelDetails}
        modelUpdatedAt={modelUpdatedAt}
        alerts={alerts}
        loading={booting}
      />
    ),
    Telemetry: (
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <LiveTelemetryGraph data={telemetry} />
        </div>
        <div className="xl:col-span-4">
          <AnomalyDetectionPanel anomalyScore={anomalyScore} isAnomaly={isAnomaly} modelDetails={modelDetails} modelUpdatedAt={modelUpdatedAt} />
        </div>
        <div className="xl:col-span-12">
          <AlertsFeed alerts={alerts} />
        </div>
        <div className="xl:col-span-12">
          <AnomalyScenarioPanel />
        </div>
      </div>
    ),
    'Collision Alerts': (
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <CollisionRiskPanel />
        </div>
        <div className="xl:col-span-7">
          <AlertsFeed alerts={alerts} />
        </div>
        <div className="xl:col-span-12">
          <Card>
            <div className="text-sm text-slate-400">Avoidance Guidance</div>
            <h3 className="mt-2 text-xl font-semibold text-white">Conjunction response recommendation</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">Based on current propagation, mission planning should prepare a minor prograde burn window within the next orbital cycle.</p>
          </Card>
        </div>
      </div>
    ),
    '3D Visualization': <VisualizationPage objects={spaceObjects as SpaceObject[]} />,
    Satellites: (
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {satellites.map((satellite) => (
          <Card key={satellite.id} className="h-full">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-slate-400">Satellite</div>
                <h3 className="mt-1 text-xl font-semibold text-white">{satellite.name}</h3>
              </div>
              <Badge tone={satellite.status === 'Nominal' ? 'success' : 'warning'}>{satellite.status}</Badge>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-slate-400">Altitude</div>
                <div className="mt-1 text-white">{satellite.altitude} km</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-slate-400">Battery</div>
                <div className="mt-1 text-white">{satellite.telemetry.battery}%</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-slate-400">Temp</div>
                <div className="mt-1 text-white">{satellite.telemetry.temperature} C</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-slate-400">Signal</div>
                <div className="mt-1 text-white">{satellite.telemetry.signal}%</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    ),
    Settings: (
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-6">
          <Card>
            <div className="text-sm text-slate-400">Alert Thresholds</div>
            <h3 className="mt-2 text-xl font-semibold text-white">Detection sensitivity</h3>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">Anomaly threshold: <span className="text-white">45</span></div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">Collision warning distance: <span className="text-white">1.2 km</span></div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">Critical distance: <span className="text-white">0.7 km</span></div>
            </div>
          </Card>
        </div>
        <div className="xl:col-span-6">
          <Card>
            <div className="text-sm text-slate-400">Telemetry Stream</div>
            <h3 className="mt-2 text-xl font-semibold text-white">System controls</h3>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">Live ingest: enabled</div>
              <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4 text-sm text-cyan-200">3D track overlays: enabled</div>
              <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-200">Auto-maneuver mode: advisory only</div>
            </div>
          </Card>
        </div>
      </div>
    ),
  };

  const content = contentByView[activeView];

  return (
    <div className="flex min-h-full bg-[radial-gradient(circle_at_10%_0%,_rgba(56,189,248,0.16),_transparent_34%),radial-gradient(circle_at_88%_10%,_rgba(251,191,36,0.14),_transparent_28%),linear-gradient(165deg,#06132b_0%,#040b1d_34%,#03060e_100%)] text-slate-100">
      <Sidebar activeView={activeView} onSelect={(view) => setActiveView(view as View)} />

      <div className="flex min-h-full flex-1 flex-col">
        <Navbar status={systemStatus} onMenuClick={() => setNavOpen((value) => !value)} />

        {navOpen && (
          <div className="lg:hidden">
            <div className="glass mx-4 mt-4 rounded-3xl border border-white/10 p-4 shadow-glow">
              <div className="grid gap-2.5 sm:grid-cols-2">
                {views.map((view) => (
                  <button
                    key={view}
                    onClick={() => {
                      setActiveView(view);
                      setNavOpen(false);
                    }}
                    className={`rounded-2xl px-4 py-3 text-left text-sm transition ${
                      activeView === view ? 'bg-cyan-400/12 text-cyan-200' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 lg:p-7 xl:p-8">
          <div className="mx-auto w-full max-w-[1700px]">
            {activeView === '3D Visualization' ? (
              content
            ) : (
              <>
                <div className="mb-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="glass noise-overlay rounded-3xl border border-cyan-100/15 p-6 shadow-[0_18px_36px_rgba(2,6,23,0.34)]">
                    <div className="text-[13px] text-slate-400">Connection</div>
                    <div className="panel-title mt-3 text-[2rem] font-semibold leading-none text-emerald-300">Online</div>
                  </div>
                  <div className="glass noise-overlay rounded-3xl border border-cyan-100/15 p-6 shadow-[0_18px_36px_rgba(2,6,23,0.34)]">
                    <div className="text-[13px] text-slate-400">Current anomaly score</div>
                    <div className="panel-title mt-3 text-[2rem] font-semibold leading-none text-white">{anomalyScore}</div>
                  </div>
                  <div className="glass noise-overlay rounded-3xl border border-cyan-100/15 p-6 shadow-[0_18px_36px_rgba(2,6,23,0.34)]">
                    <div className="text-[13px] text-slate-400">Tracked alerts</div>
                    <div className="panel-title mt-3 text-[2rem] font-semibold leading-none text-white">{alerts.length}</div>
                  </div>
                  <div className="glass noise-overlay rounded-3xl border border-cyan-100/15 p-6 shadow-[0_18px_36px_rgba(2,6,23,0.34)]">
                    <div className="text-[13px] text-slate-400">Collision risk</div>
                    <div className="panel-title mt-3 text-[2rem] font-semibold leading-none text-rose-300">
                      {collisionScan?.critical_count || 0 > 0
                        ? 'Critical'
                        : collisionScan?.high_count || 0 > 0
                          ? 'High'
                          : collisionScan?.medium_count || 0 > 0
                            ? 'Medium'
                            : 'Low'}
                    </div>
                  </div>
                </div>
                {content}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}