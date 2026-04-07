import { useEffect, useState, useCallback } from "react";

export interface Signal {
  id: string;
  type: string;
  time: string;
  confidence: string;
  trend: "up" | "down";
  price: string;
  change: string;
  dataSource?: string;
}

export function useSignals(refreshIntervalMs = 30000) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const refresh = useCallback(() => {
    fetch("/api/signals")
      .then(r => r.json())
      .then(({ signals: data, timestamp }) => {
        setSignals(data ?? []);
        setLastUpdated(timestamp ? new Date(timestamp).toLocaleTimeString() : "");
        setError(null);
      })
      .catch(() => setError("Failed to load signals"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, refreshIntervalMs);
    return () => clearInterval(timer);
  }, [refresh, refreshIntervalMs]);

  return { signals, loading, error, lastUpdated, refresh };
}
