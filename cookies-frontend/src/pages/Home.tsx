import { usePods } from "../components/PodsProvider";
import { Link } from "react-router-dom";
import { useState } from "react";
import apiUrl from "../components/apiUrl";

export default function Home() {
  const { pods, loading, error, refetch } = usePods();
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joinMsg, setJoinMsg] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [showCreatePod, setShowCreatePod] = useState(false);
  const [newPodName, setNewPodName] = useState("");
  const [creatingPod, setCreatingPod] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleJoinByCode = async () => {
    if (!joinCodeInput.trim()) {
      setJoinMsg("Enter an invite code to join");
      return;
    }

    setJoining(true);
    setJoinMsg(null);
    try {
      const res = await fetch(`${apiUrl}/pod/join/${joinCodeInput.trim()}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.detail || data?.msg || res.statusText || "Failed to join pod");
      }
      setJoinMsg(data?.msg || "Joined pod successfully");
      setJoinCodeInput("");
      refetch();
    } catch (err: any) {
      console.error("Join by code failed", err);
      setJoinMsg(err?.message || String(err));
    } finally {
      setJoining(false);
    }
  };

  const handleCreatePod = async () => {
    if (!newPodName.trim()) {
      setCreateError("Pod name is required");
      return;
    }

    setCreatingPod(true);
    setCreateError(null);
    try {
      const res = await fetch(`${apiUrl}/new/pod`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newPodName }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`${res.status} ${txt}`);
      }
      setNewPodName("");
      setShowCreatePod(false);
      refetch();
    } catch (err: any) {
      setCreateError(err?.message || String(err));
    } finally {
      setCreatingPod(false);
    }
  };

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
        <Link to="/manage-pods" className="text-blue-500 hover:underline">
          Create a new pod
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
          Your Pods
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowCreatePod(!showCreatePod);
              if (!showCreatePod) setShowJoinInput(false);
            }}
            className="px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors"
          >
            {showCreatePod ? "Cancel" : "Create Pod"}
          </button>
          <button
            onClick={() => {
              setShowJoinInput(!showJoinInput);
              if (!showJoinInput) setShowCreatePod(false);
            }}
            className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors"
          >
            {showJoinInput ? "Cancel" : "Join Pod"}
          </button>
        </div>
      </div>
      
      {/* Create Pod - Collapsible */}
      {showCreatePod && (
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Create New Pod</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPodName}
              onChange={(e) => setNewPodName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreatePod()}
              placeholder="Enter pod name"
              className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg text-sm dark:bg-zinc-700 dark:text-zinc-100"
              autoFocus
            />
            <button
              onClick={handleCreatePod}
              disabled={creatingPod}
              className="px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 disabled:opacity-50"
            >
              {creatingPod ? "Creating..." : "Create"}
            </button>
          </div>
          {createError && (
            <p className="text-xs mt-2 text-red-600 dark:text-red-400">
              {createError}
            </p>
          )}
        </div>
      )}
      
      {/* Join by Invite Code - Collapsible */}
      {showJoinInput && (
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Enter Invite Code</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleJoinByCode()}
              placeholder="Enter invite code"
              className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg text-sm dark:bg-zinc-700 dark:text-zinc-100"
              autoFocus
            />
            <button
              onClick={handleJoinByCode}
              disabled={joining}
              className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50"
            >
              {joining ? "Joining..." : "Join"}
            </button>
          </div>
          {joinMsg && (
            <p className={`text-xs mt-2 ${joinMsg.includes("success") || joinMsg.includes("Joined") ? "text-green-600 dark:text-green-400" : "text-zinc-600 dark:text-zinc-400"}`}>
              {joinMsg}
            </p>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pods.map((pod) => (
          <Link
            to={`/pod/${pod.pod_id}`}
          >
            <div
              key={pod.pod_id}
              className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-zinc-700 dark:bg-zinc-800 h-32 flex items-center justify-center"
            >
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 text-center wrap-break-word">
                {pod.pod_name}
              </h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
