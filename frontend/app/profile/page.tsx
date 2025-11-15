"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiUrl from "@/components/apiUrl";

type UserProfile = {
    id: number;
    username: string;
    first_name: string;
    surname: string;
    birthday: string;
};

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [deleteStep, setDeleteStep] = useState(0);
    const [usernameConfirm, setUsernameConfirm] = useState("");
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`${apiUrl}/profile`, {
                    credentials: "include",
                    cache: "no-store",
                });
                if (!res.ok) {
                    const txt = await res.text();
                    throw new Error(`${res.status} ${txt}`);
                }
                const data = await res.json();
                setProfile(data);
                setError(null);
            } catch (err: any) {
                setError(err?.message || String(err));
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleCopyId = async () => {
        if (profile) {
            await navigator.clipboard.writeText(profile.id.toString());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDeleteAccount = async () => {
        if (!profile) return;
        
        setDeleting(true);
        try {
            const res = await fetch(`${apiUrl}/user`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`${res.status} ${txt}`);
            }
            router.push("/");
        } catch (err: any) {
            setError(err?.message || String(err));
        } finally {
            setDeleting(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading profile...</div>;
    if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
    if (!profile) return <div className="p-8 text-center">No profile data</div>;

    const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

    return (
        <div className="mx-auto max-w-3xl p-8">
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mb-8">
                Your Profile
            </h1>
            <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6 space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-blue-700 dark:text-blue-400">Your User ID</label>
                            <p className="text-lg font-mono text-zinc-900 dark:text-zinc-100">{profile.id}</p>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Share this ID to join a pod</p>
                        </div>
                        <button
                            onClick={handleCopyId}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            {copied ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                                    </svg>
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                        <path d="M7.5 3.375c0-1.036.84-1.875 1.875-1.875h.375a3.75 3.75 0 0 1 3.75 3.75v1.875C13.5 8.161 14.34 9 15.375 9h1.875A3.75 3.75 0 0 1 21 12.75v3.375C21 17.16 20.16 18 19.125 18h-9.75A1.875 1.875 0 0 1 7.5 16.125V3.375Z" />
                                        <path d="M15 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 17.25 7.5h-1.875A.375.375 0 0 1 15 7.125V5.25ZM4.875 6H6v10.125A3.375 3.375 0 0 0 9.375 19.5H16.5v1.125c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625V7.875C3 6.839 3.84 6 4.875 6Z" />
                                    </svg>
                                    Copy ID
                                </>
                            )}
                        </button>
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Username</label>
                    <p className="text-lg text-zinc-900 dark:text-zinc-100">{profile.username}</p>
                </div>
                <div>
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">First Name</label>
                    <p className="text-lg text-zinc-900 dark:text-zinc-100">{capitalize(profile.first_name)}</p>
                </div>
                <div>
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Surname</label>
                    <p className="text-lg text-zinc-900 dark:text-zinc-100">{capitalize(profile.surname)}</p>
                </div>
                <div>
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Birthday</label>
                    <p className="text-lg text-zinc-900 dark:text-zinc-100">{profile.birthday}</p>
                </div>
            </div>

            <div className="mt-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Danger Zone</h2>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                    Deleting your account is permanent and cannot be undone.
                </p>

                {deleteStep === 0 && (
                    <button
                        onClick={() => setDeleteStep(1)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                    >
                        Delete Account
                    </button>
                )}

                {deleteStep === 1 && (
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-zinc-800 border border-red-300 dark:border-red-700 rounded-lg p-4">
                            <p className="text-sm text-zinc-900 dark:text-zinc-100 font-medium mb-3">
                                Are you absolutely sure you want to delete your account?
                            </p>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4">
                                This will permanently delete all your data including items and pod memberships.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setDeleteStep(2)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                                >
                                    Yes, Continue
                                </button>
                                <button
                                    onClick={() => setDeleteStep(0)}
                                    className="px-4 py-2 bg-zinc-300 text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-400 dark:bg-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-500"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {deleteStep === 2 && (
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-zinc-800 border border-red-300 dark:border-red-700 rounded-lg p-4">
                            <p className="text-sm text-zinc-900 dark:text-zinc-100 font-medium mb-3">
                                Final confirmation required
                            </p>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4">
                                Type your username <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">{profile.username}</span> to confirm deletion:
                            </p>
                            <input
                                type="text"
                                value={usernameConfirm}
                                onChange={(e) => setUsernameConfirm(e.target.value)}
                                placeholder="Enter your username"
                                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg text-sm mb-4 dark:bg-zinc-700 dark:text-zinc-100"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={usernameConfirm !== profile.username || deleting}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {deleting ? "Deleting..." : "Delete My Account"}
                                </button>
                                <button
                                    onClick={() => {
                                        setDeleteStep(0);
                                        setUsernameConfirm("");
                                    }}
                                    disabled={deleting}
                                    className="px-4 py-2 bg-zinc-300 text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-400 dark:bg-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-500 disabled:opacity-50"
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