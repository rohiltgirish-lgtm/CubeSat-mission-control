import { Activity, LayoutDashboard, Radar, Satellite, Settings, ShieldAlert } from 'lucide-react';
import { sidebarItems } from '../data/mockData';
import { cn } from '../utils/cn';

const icons = [LayoutDashboard, Activity, ShieldAlert, Radar, Satellite, Settings];

type SidebarProps = {
  activeView: string;
  onSelect: (view: string) => void;
};

export function Sidebar({ activeView, onSelect }: SidebarProps) {
  return (
    <aside className="glass noise-overlay relative hidden h-full w-72 flex-col border-r border-cyan-200/10 px-5 py-6 shadow-[0_0_60px_rgba(56,189,248,0.08)] lg:flex">
      <div className="mb-10 px-2">
        <div className="text-[11px] uppercase tracking-[0.35em] text-cyan-300/75">Mission Control</div>
        <h1 className="panel-title mt-3 text-3xl font-semibold text-white">CubeSat Pulse</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300/90">Anomaly detection and conjunction pre-alert operations.</p>
      </div>

      <nav className="flex-1 space-y-2.5">
        {sidebarItems.map((item, index) => {
          const Icon = icons[index];
          const isActive = activeView === item;

          return (
            <button
              key={item}
              onClick={() => onSelect(item)}
              className={cn(
                'flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm transition-all duration-300',
                isActive
                  ? 'bg-gradient-to-r from-cyan-400/16 to-blue-400/6 text-cyan-100 ring-1 ring-cyan-200/35 shadow-[inset_0_0_0_1px_rgba(186,230,253,0.2),0_0_35px_rgba(34,211,238,0.12)]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
              )}
            >
              {isActive && <span className="h-5 w-1 rounded-full bg-cyan-300" aria-hidden />}
              <Icon className={cn('h-4 w-4', isActive ? 'text-cyan-300' : 'text-slate-500')} />
              <span>{item}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-6 rounded-3xl border border-cyan-200/20 bg-gradient-to-b from-cyan-400/8 to-blue-400/5 p-5 text-sm text-slate-300">
        <div className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Flight Status</div>
        <p className="mt-3 leading-6 text-slate-200/95">All systems nominal. Continuous telemetry ingest and orbit hazard screening active.</p>
      </div>
    </aside>
  );
}