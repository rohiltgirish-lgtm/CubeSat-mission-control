import { Bell, CircleUserRound, Menu, Signal } from 'lucide-react';
import { Badge } from './ui/Badge';

type NavbarProps = {
  status: 'Connected' | 'Warning' | 'Critical';
  onMenuClick: () => void;
};

const toneByStatus = {
  Connected: 'success',
  Warning: 'warning',
  Critical: 'danger',
} as const;

export function Navbar({ status, onMenuClick }: NavbarProps) {
  return (
    <header className="glass sticky top-0 z-20 flex items-center justify-between border-b border-cyan-100/10 px-4 py-4 lg:px-7 lg:py-4.5 backdrop-blur-2xl">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-100/15 bg-white/5 text-slate-200 transition hover:bg-white/10 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-cyan-300/75">
            <Signal className="h-3.5 w-3.5" />
            Mission Control
          </div>
          <h2 className="panel-title mt-1.5 text-lg font-semibold text-white lg:text-[1.55rem]">CubeSat Telemetry Anomaly & Collision Pre-Alert System</h2>
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-4">
        <Badge tone={toneByStatus[status]}>System {status}</Badge>
        <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-100/15 bg-white/5 text-slate-200 transition hover:bg-white/10">
          <Bell className="h-5 w-5" />
        </button>
        <div className="flex h-11 items-center gap-2 rounded-2xl border border-cyan-100/15 bg-white/5 px-3 pr-4">
          <CircleUserRound className="h-5 w-5 text-cyan-300" />
          <div className="hidden text-left sm:block">
            <div className="text-sm text-white">Flight Ops</div>
            <div className="text-xs text-slate-400">Orbit desk</div>
          </div>
        </div>
      </div>
    </header>
  );
}