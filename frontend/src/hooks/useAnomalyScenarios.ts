import { useEffect, useState } from 'react';
import { AlertItem, TelemetryPoint } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export interface AnomalyScenarioData {
  scenario_type: 'thermal_spike' | 'voltage_drop' | 'signal_loss' | 'normal';
  description: string;
  telemetry: TelemetryPoint[];
  score: number;
  is_anomaly: boolean;
  alert: AlertItem | null;
}

export interface AnomalyScenariosData {
  scenarios: AnomalyScenarioData[];
}

export function useAnomalyScenarios() {
  const [scenarios, setScenarios] = useState<AnomalyScenarioData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchScenarios = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/telemetry/anomaly-scenarios`);

        if (!response.ok) {
          throw new Error(`Failed to fetch anomaly scenarios: ${response.statusText}`);
        }

        const data: AnomalyScenariosData = await response.json();

        if (active) {
          setScenarios(data.scenarios);
          setError(null);
        }
      } catch (err) {
        if (active) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          setError(errorMsg);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchScenarios();
    const interval = window.setInterval(() => {
      void fetchScenarios();
    }, 60000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return { scenarios, loading, error };
}
