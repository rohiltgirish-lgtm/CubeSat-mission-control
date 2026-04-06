import { Radar } from 'lucide-react';
import { useDebrisCollisionScan } from '../hooks/useDebrisCollisionScan';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';

export function CollisionRiskPanel() {
  const { scan, loading } = useDebrisCollisionScan();

  if (loading || !scan) {
    return (
      <Card className="h-full">
        <div className="text-sm text-slate-400">Collision Risk</div>
        <h3 className="mt-2 text-xl font-semibold text-white">Scanning debris field...</h3>
        <div className="mt-6 animate-pulse space-y-3">
          <div className="h-10 rounded bg-white/5"></div>
          <div className="h-10 rounded bg-white/5"></div>
        </div>
      </Card>
    );
  }

  const overallLevel = 
    scan.critical_count > 0 ? 'Critical' : 
    scan.high_count > 0 ? 'High' : 
    scan.medium_count > 0 ? 'Medium' : 
    'Low';

  const tone = overallLevel === 'Low' ? 'success' : overallLevel === 'Medium' ? 'warning' : 'danger';

  const topDebris = scan.at_risk_debris.slice(0, 3);

  return (
    <Card className="h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-slate-400">Collision Risk</div>
          <h3 className="mt-2 text-xl font-semibold text-white">Conjunction pre-alert window</h3>
        </div>
        <Badge tone={tone}>{overallLevel}</Badge>
      </div>

      <div className="mt-6 space-y-4 text-sm">
        <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
          <div className="text-slate-400">Debris scanned: {scan.total_debris_scanned}</div>
          <div className="mt-2 flex gap-3 text-xs">
            <div className="rounded-lg bg-rose-500/20 px-2 py-1 text-rose-200">Critical: {scan.critical_count}</div>
            <div className="rounded-lg bg-amber-500/20 px-2 py-1 text-amber-200">High: {scan.high_count}</div>
            <div className="rounded-lg bg-yellow-500/20 px-2 py-1 text-yellow-200">Med: {scan.medium_count}</div>
          </div>
        </div>

        {topDebris.length > 0 && (
          <div>
            <div className="mb-2 text-slate-400">Top at-risk debris:</div>
            <div className="space-y-2">
              {topDebris.map((debris) => (
                <div key={debris.debris_id} className="rounded-xl border border-cyan-300/15 bg-cyan-400/5 p-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-cyan-100">{debris.debris_name}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      debris.risk_level === 'Critical' ? 'bg-rose-500/30 text-rose-200' :
                      debris.risk_level === 'High' ? 'bg-amber-500/30 text-amber-200' :
                      debris.risk_level === 'Medium' ? 'bg-yellow-500/30 text-yellow-200' :
                      'bg-green-500/30 text-green-200'
                    }`}>
                      {debris.risk_level}
                    </span>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-1 text-[10px] text-slate-300">
                    <div>Miss: {debris.miss_distance_km.toFixed(2)} km</div>
                    <div>Score: {debris.risk_score.toFixed(0)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center gap-2 text-cyan-200">
        <Radar className="h-4 w-4" />
        <span className="text-sm">Real-time ML model evaluating debris conjunction risk.</span>
      </div>
    </Card>
  );
}