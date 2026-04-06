import { AlertTriangle, Activity } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

type AnomalyDetectionPanelProps = {
  anomalyScore: number;
  isAnomaly: boolean;
  modelDetails: string;
  modelUpdatedAt: string | null;
};

export function AnomalyDetectionPanel({ anomalyScore, isAnomaly, modelDetails, modelUpdatedAt }: AnomalyDetectionPanelProps) {
  const status = isAnomaly ? 'Anomaly' : 'Normal';
  const tone = status === 'Normal' ? 'success' : 'danger';

  return (
    <Card className="h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-slate-400">Anomaly Detection</div>
          <h3 className="mt-2 text-xl font-semibold text-white">Machine-assisted outlier scoring</h3>
        </div>
        <Badge tone={tone}>{status}</Badge>
      </div>

      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <div className="text-5xl font-semibold tracking-tight text-white">{anomalyScore}</div>
          <div className="mt-2 text-sm text-slate-400">Risk normalized to 100-point scale</div>
        </div>
        <div className="rounded-3xl border border-white/8 bg-white/5 p-4 text-slate-300">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Activity className="h-4 w-4 text-cyan-300" />
            Threshold
          </div>
          <div className="mt-2 text-lg font-medium text-white">45</div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-rose-400/15 bg-rose-500/8 p-4 text-sm text-rose-100">
        <div className="flex items-center gap-2 font-medium">
          <AlertTriangle className="h-4 w-4" />
          {modelDetails}
        </div>
        <div className="mt-2 text-xs text-rose-100/75">{modelUpdatedAt ? `Model updated at ${modelUpdatedAt}` : 'Waiting for model response...'}</div>
      </div>
    </Card>
  );
}