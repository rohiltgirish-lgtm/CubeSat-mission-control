import { AlertItem, SatelliteSummary, TelemetryPoint } from '../types';
import { AlertsFeed } from './AlertsFeed';
import { AnomalyDetectionPanel } from './AnomalyDetectionPanel';
import { Card } from './ui/Card';
import { CollisionRiskPanel } from './CollisionRiskPanel';
import { LiveTelemetryGraph } from './LiveTelemetryGraph';
import { SatelliteStatusCard } from './SatelliteStatusCard';
import { Skeleton } from './Skeleton';

type DashboardPageProps = {
  satellite: SatelliteSummary;
  telemetry: TelemetryPoint[];
  anomalyScore: number;
  isAnomaly: boolean;
  modelDetails: string;
  modelUpdatedAt: string | null;
  alerts: AlertItem[];
  loading: boolean;
};

export function DashboardPage({ satellite, telemetry, anomalyScore, isAnomaly, modelDetails, modelUpdatedAt, alerts, loading }: DashboardPageProps) {
  if (loading) {
    return (
      <div className="grid gap-6 xl:grid-cols-12">
        <Skeleton className="h-[210px] xl:col-span-4" />
        <Skeleton className="h-[210px] xl:col-span-8" />
        <Skeleton className="h-[220px] xl:col-span-6" />
        <Skeleton className="h-[220px] xl:col-span-6" />
        <Skeleton className="h-[300px] xl:col-span-12" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-12">
      <div className="xl:col-span-4">
        <SatelliteStatusCard satellite={satellite} />
      </div>
      <div className="xl:col-span-8">
        <LiveTelemetryGraph data={telemetry} />
      </div>
      <div className="xl:col-span-6">
        <AnomalyDetectionPanel anomalyScore={anomalyScore} isAnomaly={isAnomaly} modelDetails={modelDetails} modelUpdatedAt={modelUpdatedAt} />
      </div>
      <div className="xl:col-span-6">
        <CollisionRiskPanel />
      </div>
      <div className="xl:col-span-12">
        <AlertsFeed alerts={alerts} />
      </div>
      <div className="xl:col-span-12">
        <Card className="grid gap-5 md:grid-cols-3">
          <div>
            <div className="text-sm text-slate-400">Mission Summary</div>
            <div className="mt-2.5 text-lg font-semibold text-white">Automated pre-alert watch</div>
            <p className="mt-3 text-sm leading-6 text-slate-400">Telemetry ingest, anomaly scoring, and collision screening are synchronized into a single flight loop.</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/5 p-5">
            <div className="text-slate-400">Orbit state</div>
            <div className="mt-2.5 text-2xl font-semibold text-cyan-200">LEO tracking</div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/5 p-5">
            <div className="text-slate-400">Alert cadence</div>
            <div className="mt-2.5 text-2xl font-semibold text-white">2.4s refresh</div>
          </div>
        </Card>
      </div>
    </div>
  );
}