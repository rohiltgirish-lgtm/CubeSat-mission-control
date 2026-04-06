import { useAnomalyScenarios } from '../hooks/useAnomalyScenarios';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

export function AnomalyScenarioPanel() {
  const { scenarios, loading } = useAnomalyScenarios();

  if (loading) {
    return (
      <Card>
        <div className="text-sm text-slate-400">Anomaly Scenarios</div>
        <h3 className="mt-2 text-xl font-semibold text-white">Loading scenarios...</h3>
        <div className="mt-6 animate-pulse space-y-3">
          <div className="h-16 rounded bg-white/5"></div>
          <div className="h-16 rounded bg-white/5"></div>
          <div className="h-16 rounded bg-white/5"></div>
          <div className="h-16 rounded bg-white/5"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <div className="text-sm text-slate-400">Anomaly Detection</div>
      <h3 className="mt-2 text-xl font-semibold text-white">Scenario responses</h3>

      <div className="mt-5 space-y-3">
        {scenarios.map((scenario) => {
          const bgColor =
            scenario.scenario_type === 'normal'
              ? 'bg-green-500/10 border-green-500/20'
              : scenario.scenario_type === 'thermal_spike'
                ? 'bg-red-500/10 border-red-500/20'
                : scenario.scenario_type === 'voltage_drop'
                  ? 'bg-orange-500/10 border-orange-500/20'
                  : 'bg-yellow-500/10 border-yellow-500/20';

          const textColor =
            scenario.scenario_type === 'normal'
              ? 'text-green-200'
              : scenario.scenario_type === 'thermal_spike'
                ? 'text-red-200'
                : scenario.scenario_type === 'voltage_drop'
                  ? 'text-orange-200'
                  : 'text-yellow-200';

          const labelText =
            scenario.scenario_type === 'normal'
              ? 'Normal'
              : scenario.scenario_type === 'thermal_spike'
                ? 'Thermal'
                : scenario.scenario_type === 'voltage_drop'
                  ? 'Voltage'
                  : 'Signal';

          return (
            <div key={scenario.scenario_type} className={`rounded-xl border ${bgColor} p-3`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold capitalize text-slate-200">{labelText} Scenario</div>
                  <p className="mt-0.5 text-xs text-slate-400">{scenario.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${textColor}`}>{scenario.score.toFixed(1)}</div>
                  {scenario.is_anomaly && (
                    <Badge tone="danger">Anomaly</Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-lg border border-cyan-300/20 bg-cyan-400/5 p-3 text-xs text-cyan-200">
        Model runs real inference on simulated anomaly patterns. Watch scores vary by failure mode.
      </div>
    </Card>
  );
}
