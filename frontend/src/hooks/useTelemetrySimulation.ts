import { useEffect, useState, useRef } from 'react';
import { initialAlerts, initialTelemetry } from '../data/mockData';
import { AlertItem, TelemetryPoint } from '../types';

export function useTelemetrySimulation() {
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>(initialTelemetry);
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [anomalyScore, setAnomalyScore] = useState(18);
  const [isAnomaly, setIsAnomaly] = useState(false);
  const [modelDetails, setModelDetails] = useState('Awaiting model output...');
  const [modelUpdatedAt, setModelUpdatedAt] = useState<string | null>(null);
  const telemetryRef = useRef(telemetry);

  // Keep ref proxy in sync for the interval
  useEffect(() => {
    telemetryRef.current = telemetry;
  }, [telemetry]);

  useEffect(() => {
    let active = true;

    const tick = async () => {
      // Fetch backend-generated telemetry and ML prediction together.
      try {
        const response = await fetch('http://localhost:8000/api/telemetry/live');

        if (response.ok) {
          const data = await response.json();
          if (!active) return;

          const backendTelemetry = Array.isArray(data.telemetry)
            ? (data.telemetry as TelemetryPoint[])
            : telemetryRef.current;
          setTelemetry(backendTelemetry);
          
          const newScore = Math.max(0, Math.min(100, Math.round(data.score)));
          setAnomalyScore(newScore);
          setIsAnomaly(Boolean(data.is_anomaly));
          setModelDetails(typeof data.details === 'string' ? data.details : 'Inference completed');
          setModelUpdatedAt(new Date().toLocaleTimeString([], { hour12: false }));

          // Use the latest live point for alert descriptions
          if (data.is_anomaly && data.alert) {
            const backendAlert: AlertItem = {
              id: String(data.alert.id),
              timestamp: String(data.alert.timestamp),
              severity: data.alert.severity as AlertItem['severity'],
              title: String(data.alert.title),
              description: String(data.alert.description),
            };
            setAlerts((prev) => [backendAlert, ...prev].slice(0, 12));
          } else {
            // Gradually decay historical alerts when the model reports normal behavior.
            setAlerts((prev) => prev.slice(0, Math.max(0, prev.length - 1)));
          }
        }
      } catch (err) {
        console.error("Failed to fetch anomaly prediction from API:", err);
      }
    };

    const interval = window.setInterval(tick, 2400);
    return () => {
      active = false;
      window.clearInterval(interval);
    }
  }, []);

  return { telemetry, alerts, anomalyScore, isAnomaly, modelDetails, modelUpdatedAt };
}
