import { TelemetryPoint } from '../types';
import { Card } from './ui/Card';

type LiveTelemetryGraphProps = {
  data: TelemetryPoint[];
};

function createPath(values: number[], width: number, height: number, padding = 18) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);

  return values
    .map((value, index) => {
      const x = padding + (index * (width - padding * 2)) / Math.max(1, values.length - 1);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

function SparkLine({ data, color, label }: { data: number[]; color: string; label: string }) {
  const width = 320;
  const height = 160;
  const path = createPath(data, width, height);

  return (
    <div className="rounded-2xl border border-white/8 bg-white/5 p-5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span style={{ color }}>{data[data.length - 1]?.toFixed?.(1) ?? data[data.length - 1]}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 h-36 w-full">
        <defs>
          <linearGradient id={`${label}-gradient`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>
        <path d={path} fill="none" stroke={`url(#${label}-gradient)`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function LiveTelemetryGraph({ data }: LiveTelemetryGraphProps) {
  const temperatures = data.map((point) => point.temperature);
  const voltages = data.map((point) => point.voltage * 10);
  const signals = data.map((point) => point.signal);

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm text-slate-400">Live Telemetry</div>
          <h3 className="mt-2.5 text-xl font-semibold text-white">Environmental and comms profile</h3>
        </div>
        <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">Real-time stream</div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <SparkLine data={temperatures} color="#22d3ee" label="Temperature °C" />
        <SparkLine data={voltages} color="#38bdf8" label="Voltage x10" />
        <SparkLine data={signals} color="#4ade80" label="Signal dBm" />
      </div>
    </Card>
  );
}