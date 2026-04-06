import { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export interface DebrisItem {
  id: string;
  name: string;
  altitude: number;
  inclination: number;
  raan: number;
  phase: number;
  angular_velocity: number;
  velocity: number;
  risk_score: number;
  risk_level: 'Critical' | 'High' | 'Medium' | 'Low';
}

export function useDebrisData() {
  const [debris, setDebris] = useState<DebrisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchDebris = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/collision/debris`);

        if (!response.ok) {
          throw new Error(`Failed to fetch debris: ${response.statusText}`);
        }

        const data = await response.json();

        if (active) {
          setDebris(data.debris || []);
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

    void fetchDebris();
    const interval = window.setInterval(() => {
      void fetchDebris();
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return { debris, loading, error };
}
