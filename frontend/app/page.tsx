"use client";
import React from "react";
import { usePods } from "@/components/PodsProvider";
import Link from "next/link";

export default function Home() {
  const { pods, loading, error } = usePods();

  if (loading) {
    return <div className="mx-auto max-w-3xl p-8 text-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-8 text-center text-red-600">
        Error: {error}
      </div>
    );
  }

  if (!pods || pods.length === 0) {
    return (
      <div className="mx-auto max-w-3xl p-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
          No Pods Available
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300">
          There are currently no pods to display.
        </p>
        <Link href="/create-pod" className="text-blue-500 hover:underline">
          Create a new pod
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-8">
      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mb-6 text-center">
        Your Pods
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pods.map((pod) => (
          <div
            key={pod.pod_id}
            className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-zinc-700 dark:bg-zinc-800 h-32 flex items-center justify-center"
          >
            <Link
              href={`/pod/${pod.pod_id}`}
              className="absolute inset-0"
            >
            </Link>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 text-center wrap-break-word">
              {pod.pod_name}
            </h2>
          </div>
        ))}
      </div>
    </div>
  );
}
