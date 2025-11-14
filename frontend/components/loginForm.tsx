"use client";

import React, { useState } from "react";
import apiUrl from "./apiUrl";
import userLogin from "../models/userLogin";

export type LoginFormProps = {
  onSuccess?: (data: any) => void;
};

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const payload = new userLogin(username, password);

    try {
      const res = await fetch(`${apiUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setError(data?.message || `Login failed (${res.status})`);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
      // notify parent that login succeeded and pass response data
      try {
        onSuccess?.(data);
      } catch (err) {
        // swallow errors from callback to avoid breaking the form flow
        console.error("onSuccess callback error:", err);
      }
    } catch (err) {
      setError((err as Error)?.message || "Network error");
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-lg border bg-white p-6 shadow-sm dark:bg-zinc-900"
    >
      <h2 className="mb-4 text-lg font-semibold">Sign in</h2>

      <label className="mb-1 block text-sm" htmlFor="username">
        Username
      </label>
      <input
        id="username"
        name="username"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.currentTarget.value)}
        className="mb-3 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring"
        required
        aria-required
      />

      <label className="mb-1 block text-sm" htmlFor="password">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.currentTarget.value)}
        className="mb-4 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring"
        required
        aria-required
      />

      <button
        type="submit"
        disabled={loading}
        className="mb-3 w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>

      <div aria-live="polite" className="min-h-5 text-sm">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && (
          <p className="text-sm text-green-600">Signed in successfully.</p>
        )}
      </div>
    </form>
  );
}
