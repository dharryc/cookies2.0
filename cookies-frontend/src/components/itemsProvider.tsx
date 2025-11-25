import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import apiUrl from "./apiUrl";

type ItemType = {
  id: number;
  user_id: number;
  item_name: string;
  upper_price: number;
  lower_price: number;
  link: string;
  description: string;
  pods: Array<{ id: number; name: string }>;
};

type ItemsContextType = {
  items: ItemType[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

const ItemsContext = createContext<ItemsContextType | undefined>(undefined);

export function ItemsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/items`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`${res.status} ${txt}`);
      }
      const data = await res.json();
      setItems(data);
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

    fetchItems();
  }, []);

  const refetch = () => {
    fetchItems();
  };

  return (
    <ItemsContext.Provider value={{ items, loading, error, refetch }}>
      {children}
    </ItemsContext.Provider>
  );
}

export function useItems() {
  const context = useContext(ItemsContext);
  if (context === undefined) {
    throw new Error("useItems must be used within an ItemsProvider");
  }
  return context;
}
