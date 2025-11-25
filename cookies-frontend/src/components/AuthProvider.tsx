import React, { createContext, useContext } from "react";
import apiUrl from "./apiUrl";

type AuthContextType = {
  loggedIn: boolean | string | null;
  setLoggedIn: (v: boolean | string | null) => void;
  validate: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default function AuthProvider({
  children,
  loggedIn,
  setLoggedIn,
}: React.PropsWithChildren<{
  loggedIn: boolean | string | null;
  setLoggedIn: (v: boolean | string | null) => void;
}>) {
  const validate = async () => {
    try {
      const res = await fetch(`${apiUrl}/validate`, { credentials: "include" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setLoggedIn(false);
        return false;
      }
      // if server returns truthy value, keep logged in
      setLoggedIn(data);
      return true;
    } catch (err) {
      setLoggedIn(false);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ loggedIn, setLoggedIn, validate }}>
      {children}
    </AuthContext.Provider>
  );
}
