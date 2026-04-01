import { useEffect, useState, useCallback } from "react";

export interface AccountInfo {
  balance: string;
  equity: string;
  unrealizedPL: string;
  realizedPL: string;
  openPositions: number;
  currency: string;
  mt5Connected: boolean;
  mt5Server: string | null;
}

const defaultAccount: AccountInfo = {
  balance: "10000.00",
  equity: "10000.00",
  unrealizedPL: "0.00",
  realizedPL: "0.00",
  openPositions: 0,
  currency: "USD",
  mt5Connected: false,
  mt5Server: null,
};

export function useAccount() {
  const [account, setAccount] = useState<AccountInfo>(defaultAccount);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    fetch("/api/account")
      .then(r => r.json())
      .then(setAccount)
      .catch(() => {/* keep last known value */})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [refresh]);

  return { account, loading, refresh };
}
