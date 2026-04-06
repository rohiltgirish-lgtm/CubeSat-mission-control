import { useEffect, useState } from 'react';

export interface DebrisRiskItem {
  debris_id: string;
  debris_name: string;
  risk_score: number;
  risk_level: 'Critical' | 'High' | 'Medium' | 'Low';
  miss_distance_km: number;
  relative_speed_kms: number;
  time_to_closest_approach_hours: number;
}

export interface DebrisScanResult {
  primary_satellite: string;
  total_debris_scanned: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  at_risk_debris: DebrisRiskItem[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export function useDebrisCollisionScan() {
  const [scan, setScan] = useState<DebrisScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchScan = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/collision/debris-scan`);

        if (!response.ok) {
          throw new Error(`Failed to fetch debris scan: ${response.statusText}`);
        }

        const data = await response.json();

        if (active) {
          setScan(data);
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

    void fetchScan();
    // Refresh every 15 seconds (same as debris visualization)
    const interval = window.setInterval(fetchScan, 15000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return { scan, loading, error };
}
