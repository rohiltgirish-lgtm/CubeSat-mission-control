import { AlertItem } from '../types';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';

type AlertsFeedProps = {
  alerts: AlertItem[];
};

const toneBySeverity: Record<AlertItem['severity'], 'success' | 'warning' | 'danger' | 'info'> = {
  Low: 'success',
  Medium: 'warning',
  High: 'danger',
  Critical: 'danger',
};

export function AlertsFeed({ alerts }: AlertsFeedProps) {
  return (
    <Card className="h-full">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm text-slate-400">Alerts Feed</div>
          <h3 className="mt-2 text-xl font-semibold text-white">Recent anomaly and conjunction events</h3>
        </div>
        <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Streaming</div>
      </div>

      <div className="mt-5 max-h-[326px] space-y-3 overflow-y-auto pr-1">
        {alerts.map((alert) => (
          <div key={alert.id} className="rounded-2xl border border-white/8 bg-white/5 p-4 transition hover:border-cyan-300/20 hover:bg-white/7">
            <div className="flex items-center justify-between gap-4">
              <div className="font-medium text-white">{alert.title}</div>
              <Badge tone={toneBySeverity[alert.severity]}>{alert.severity}</Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">{alert.description}</p>
            <div className="mt-3 text-xs text-slate-500">{alert.timestamp}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}