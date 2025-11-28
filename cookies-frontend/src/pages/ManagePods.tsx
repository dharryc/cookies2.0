import { useState, useEffect } from "react";
import { usePods } from "../components/PodsProvider";
import apiUrl from "../components/apiUrl";

type PodInfo = {
    id: number;
    name: string;
    owner_id: number;
    members: Array<{ id: number; name: string }>;
};

type OwnedPod = {
    id: number;
    name: string;
    owner_id: number;
};

export default function ManagePodsPage() {
    const { refetch } = usePods();
    const [ownedPods, setOwnedPods] = useState<OwnedPod[]>([]);
    const [selectedPod, setSelectedPod] = useState<number | null>(null);
    const [podInfo, setPodInfo] = useState<PodInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showCreatePod, setShowCreatePod] = useState(false);
    const [newPodName, setNewPodName] = useState("");
    const [creatingPod, setCreatingPod] = useState(false);
    const [memberIdsToAdd, setMemberIdsToAdd] = useState("");
    const [memberIdsToRemove, setMemberIdsToRemove] = useState<number[]>([]);
    const [managingMembers, setManagingMembers] = useState(false);
    const [deletingPod, setDeletingPod] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [joinCodeInput, setJoinCodeInput] = useState("");
    const [joinMsg, setJoinMsg] = useState<string | null>(null);
    const [joining, setJoining] = useState(false);
    const [generatedInvite, setGeneratedInvite] = useState<{code: string, link: string, expires_at: number} | null>(null);
    const [generatingInvite, setGeneratingInvite] = useState(false);

    useEffect(() => {
        fetchOwnedPods();
    }, []);

    useEffect(() => {
        if (selectedPod) {
            fetchPodInfo(selectedPod);
        }
    }, [selectedPod]);

    const fetchOwnedPods = async () => {
        try {
            const res = await fetch(`${apiUrl}/pod/ownership`, {
                credentials: "include",
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`${res.status} ${txt}`);
            }
            const data = await res.json();
            if (data.owned_pods && Array.isArray(data.owned_pods)) {
                setOwnedPods(data.owned_pods);
            } else {
                setOwnedPods([]);
            }
        } catch (err: any) {
            console.error("Failed to fetch owned pods:", err);
            setError(err?.message || String(err));
        }
    };

    const fetchPodInfo = async (podId: number) => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/pod/info/${podId}`, {
                credentials: "include",
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`${res.status} ${txt}`);
            }
            const data = await res.json();
            setPodInfo(data);
            setError(null);
        } catch (err: any) {
            setError(err?.message || String(err));
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePod = async () => {
        if (!newPodName.trim()) {
            setError("Pod name is required");
            return;
        }

        setCreatingPod(true);
        setError(null);
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
            await fetchOwnedPods();
            refetch();
        } catch (err: any) {
            setError(err?.message || String(err));
        } finally {
            setCreatingPod(false);
        }
    };

    const handleAddMembers = async () => {
        if (!selectedPod || !memberIdsToAdd.trim()) {
            setError("Please enter member IDs");
            return;
        }

        const ids = memberIdsToAdd.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        if (ids.length === 0) {
            setError("Invalid member IDs");
            return;
        }

        setManagingMembers(true);
        setError(null);
        try {
            const res = await fetch(`${apiUrl}/pod/members?pod_id=${selectedPod}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(ids),
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`${res.status} ${txt}`);
            }
            setMemberIdsToAdd("");
            await fetchPodInfo(selectedPod);
            refetch();
        } catch (err: any) {
            setError(err?.message || String(err));
        } finally {
            setManagingMembers(false);
        }
    };

    const handleGenerateInvite = async (podId: number, expiresMinutes: number = 30) => {
        setGeneratingInvite(true);
        setError(null);
        try {
            const res = await fetch(`${apiUrl}/pod/invite/${podId}?expires_minutes=${expiresMinutes}`, {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.detail || res.statusText || "Failed to generate invite");
            }
            const data = await res.json();
            setGeneratedInvite(data);
            setJoinMsg("Invite code generated! Share the code below.");
        } catch (err: any) {
            console.error("Failed to generate invite", err);
            setError(err?.message || String(err));
        } finally {
            setGeneratingInvite(false);
        }
    };

    const handleCopyInviteCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            setJoinMsg("Invite code copied to clipboard");
        } catch (err: any) {
            console.error("Failed to copy invite code", err);
            setJoinMsg("Failed to copy invite code");
        }
    };

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
            await fetchOwnedPods();
            refetch();
        } catch (err: any) {
            console.error("Join by code failed", err);
            setJoinMsg(err?.message || String(err));
        } finally {
            setJoining(false);
        }
    };

    const handleRemoveMembers = async () => {
        if (!selectedPod || memberIdsToRemove.length === 0) {
            setError("Please select members to remove");
            return;
        }

        setManagingMembers(true);
        setError(null);
        try {
            const res = await fetch(`${apiUrl}/pod/members?pod_id=${selectedPod}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(memberIdsToRemove),
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`${res.status} ${txt}`);
            }
            setMemberIdsToRemove([]);
            await fetchPodInfo(selectedPod);
            refetch();
        } catch (err: any) {
            setError(err?.message || String(err));
        } finally {
            setManagingMembers(false);
        }
    };

    const handleDeletePod = async () => {
        if (!selectedPod) return;

        setDeletingPod(true);
        setError(null);
        try {
            const res = await fetch(`${apiUrl}/pod?pod_id=${selectedPod}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`${res.status} ${txt}`);
            }
            setShowDeleteConfirm(false);
            setSelectedPod(null);
            setPodInfo(null);
            await fetchOwnedPods();
            refetch();
        } catch (err: any) {
            setError(err?.message || String(err));
        } finally {
            setDeletingPod(false);
        }
    };

    const toggleMemberRemoval = (userId: number) => {
        setMemberIdsToRemove(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    return (
        <div className="w-full p-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Manage Pods</h1>
                    <button
                        onClick={() => setShowCreatePod(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                        Create New Pod
                    </button>
                </div>

                {/* Join by Invite Code */}
                <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 mb-6">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Join a Pod</h2>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={joinCodeInput}
                            onChange={(e) => setJoinCodeInput(e.target.value)}
                            placeholder="Enter invite code"
                            className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg text-sm dark:bg-zinc-700 dark:text-zinc-100"
                        />
                        <button
                            onClick={handleJoinByCode}
                            disabled={joining}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                        >
                            {joining ? "Joining..." : "Join"}
                        </button>
                    </div>
                    {joinMsg && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">{joinMsg}</p>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Pod List */}
                    <div className="md:col-span-1">
                        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Your Pods</h2>
                            {ownedPods.length === 0 ? (
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">You don't own any pods yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {ownedPods.map(pod => (
                                        <button
                                            key={pod.id}
                                            onClick={() => setSelectedPod(pod.id)}
                                            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                                                selectedPod === pod.id
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-600"
                                            }`}
                                        >
                                            {pod.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pod Details */}
                    <div className="md:col-span-2">
                        {!selectedPod ? (
                            <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-8 text-center">
                                <p className="text-zinc-600 dark:text-zinc-400">Select a pod to manage</p>
                            </div>
                        ) : loading ? (
                            <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-8 text-center">
                                <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
                            </div>
                        ) : podInfo ? (
                            <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{podInfo.name}</h2>
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="px-3 py-1 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
                                    >
                                        Delete Pod
                                    </button>
                                </div>

                                {/* Generate Invite */}
                                <div>
                                    <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Invite Members</h3>
                                    <button
                                        onClick={() => handleGenerateInvite(selectedPod)}
                                        disabled={generatingInvite}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                                    >
                                        {generatingInvite ? "Generating..." : "Generate Invite Code"}
                                    </button>
                                    {generatedInvite && (
                                        <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <code className="text-sm font-mono text-purple-900 dark:text-purple-100">
                                                    {generatedInvite.code}
                                                </code>
                                                <button
                                                    onClick={() => handleCopyInviteCode(generatedInvite.code)}
                                                    className="px-3 py-1 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700"
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                            <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">
                                                Expires: {new Date(generatedInvite.expires_at * 1000).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Add Members */}
                                <div>
                                    <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Add Members</h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={memberIdsToAdd}
                                            onChange={(e) => setMemberIdsToAdd(e.target.value)}
                                            placeholder="Enter user IDs (comma separated)"
                                            className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg text-sm dark:bg-zinc-700 dark:text-zinc-100"
                                        />
                                        <button
                                            onClick={handleAddMembers}
                                            disabled={managingMembers}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                                        >
                                            {managingMembers ? "Adding..." : "Add"}
                                        </button>
                                    </div>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                        Share your user ID from your profile page
                                    </p>
                                </div>

                                {/* Current Members */}
                                <div>
                                    <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                        Current Members ({podInfo.members.length})
                                    </h3>
                                    {podInfo.members.length === 0 ? (
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">No members yet</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {podInfo.members.map(member => {
                                                const [firstName, lastName] = member.name.split("|");
                                                const capitalize = (str: string) => 
                                                    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
                                                return (
                                                    <label
                                                        key={member.id}
                                                        className="flex items-center gap-3 p-3 rounded border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 cursor-pointer"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={memberIdsToRemove.includes(member.id)}
                                                            onChange={() => toggleMemberRemoval(member.id)}
                                                            className="w-4 h-4 text-red-600 rounded"
                                                        />
                                                        <div className="flex-1">
                                                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                                {capitalize(firstName)} {capitalize(lastName)}
                                                            </span>
                                                            <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2 font-mono">
                                                                (ID: {member.id})
                                                            </span>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {memberIdsToRemove.length > 0 && (
                                        <button
                                            onClick={handleRemoveMembers}
                                            disabled={managingMembers}
                                            className="mt-3 w-full px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                                        >
                                            {managingMembers ? "Removing..." : `Remove ${memberIdsToRemove.length} Member${memberIdsToRemove.length > 1 ? 's' : ''}`}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Create Pod Modal */}
                {showCreatePod && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 max-w-md w-full">
                            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Create New Pod</h2>
                            <input
                                type="text"
                                value={newPodName}
                                onChange={(e) => setNewPodName(e.target.value)}
                                placeholder="Pod name"
                                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg mb-4 dark:bg-zinc-700 dark:text-zinc-100"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCreatePod}
                                    disabled={creatingPod}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {creatingPod ? "Creating..." : "Create"}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCreatePod(false);
                                        setNewPodName("");
                                        setError(null);
                                    }}
                                    disabled={creatingPod}
                                    className="flex-1 px-4 py-2 bg-zinc-300 dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg text-sm font-medium hover:bg-zinc-400 dark:hover:bg-zinc-500 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 max-w-md w-full">
                            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Delete Pod?</h2>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                                This will permanently delete the pod and remove all members. This action cannot be undone.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleDeletePod}
                                    disabled={deletingPod}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                                >
                                    {deletingPod ? "Deleting..." : "Delete"}
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={deletingPod}
                                    className="flex-1 px-4 py-2 bg-zinc-300 dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg text-sm font-medium hover:bg-zinc-400 dark:hover:bg-zinc-500 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}