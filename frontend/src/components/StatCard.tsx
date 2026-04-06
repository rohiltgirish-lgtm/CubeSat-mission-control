import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

type StatCardProps = {
  title: string;
  value: string;
  subtitle: string;
  tone?: 'success' | 'warning' | 'danger' | 'info';
};

export function StatCard({ title, value, subtitle, tone = 'info' }: StatCardProps) {
  return (
    <Card className="min-h-[170px] animate-drift">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-slate-400">{title}</div>
          <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
          <p className="mt-2 max-w-xs text-sm leading-6 text-slate-400">{subtitle}</p>
        </div>
        <Badge tone={tone}>{tone.toUpperCase()}</Badge>
      </div>
    </Card>
  );
}