import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import apiUrl from "./apiUrl";

type PodsContextType = {
  pods: any[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

const PodsContext = createContext<PodsContextType | undefined>(undefined);

export function PodsProvider({ children }: { children: React.ReactNode }) {
  const [pods, setPods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);
  const location = useLocation();

  const fetchPods = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/pods`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`${res.status} ${txt}`);
      }
      const data = await res.json();
      setPods(data);
      setError(null);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetchPods();
  }, []);

  useEffect(() => {
    if (location.pathname === "/" && fetchedRef.current) {
      fetchPods();
    }
  }, [location.pathname]);

  const refetch = () => {
    setLoading(true);
    fetchPods();
  };

  return (
    <PodsContext.Provider value={{ pods, loading, error, refetch }}>
      {children}
    </PodsContext.Provider>
  );
}

export function usePods() {
  const context = useContext(PodsContext);
  if (context === undefined) {
    throw new Error("usePods must be used within a PodsProvider");
  }
  return context;
}
