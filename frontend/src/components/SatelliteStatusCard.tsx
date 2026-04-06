import { useEffect, useState } from 'react';
import { SatelliteSummary } from '../types';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';

type SatelliteStatusCardProps = {
  satellite: SatelliteSummary;
};

function useMissionClock() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const hh = String(Math.floor(elapsed / 3600)).padStart(2, '0');
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  return `T+ ${hh}:${mm}:${ss}`;
}

export function SatelliteStatusCard({ satellite }: SatelliteStatusCardProps) {
  const tone = satellite.health === 'Nominal' ? 'success' : satellite.health === 'Watch' ? 'warning' : 'danger';
  const missionTime = useMissionClock();

  return (
    <Card className="h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-slate-400">Satellite Status</div>
          <h3 className="mt-2.5 text-xl font-semibold text-white">{satellite.name}</h3>
        </div>
        <Badge tone={tone}>{satellite.health}</Badge>
      </div>
      <div className="mt-7 grid grid-cols-2 gap-5 text-sm">
        <div className="rounded-2xl border border-white/8 bg-white/5 p-5">
          <div className="text-slate-400">Bus state</div>
          <div className="mt-2.5 text-lg font-medium text-cyan-200">Stable</div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/5 p-5">
          <div className="text-slate-400">Last updated</div>
          <div className="mt-2.5 text-lg font-medium text-white">{missionTime}</div>
        </div>
      </div>
    </Card>
  );
}