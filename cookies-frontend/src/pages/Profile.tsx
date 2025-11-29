import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiUrl from "../components/apiUrl";
import UpdateUser from "../components/userUpdate.tsx";

type UserProfile = {
    id: number;
    username: string;
    first_name: string;
    surname: string;
    birthday: string;
    is_admin: boolean;
};

type UpdateProfileData = {
    username: string;
    first_name: string;
    surname: string;
    birthday: string;
};

type User = {
    id: number;
    username: string;
    first_name: string;
    surname: string;
    hashed_password: string;
    birthday: string;
    is_admin: number;
};

export default function ProfilePage() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [deleteStep, setDeleteStep] = useState(0);
    const [usernameConfirm, setUsernameConfirm] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [editing, setEditing] = useState(false);
    const [updateData, setUpdateData] = useState<UpdateProfileData>();
    const [showAllUsers, setShowAllUsers] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [generatingToken, setGeneratingToken] = useState<number | null>(null);
    const [resetTokens, setResetTokens] = useState<Map<number, { token: string; expires_at: number }>>(new Map());
    const [copiedTokenId, setCopiedTokenId] = useState<number | null>(null);

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
                setUpdateData({
                    username: data.username,
                    first_name: data.first_name,
                    surname: data.surname,
                    birthday: data.birthday,
                });
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
            navigate("/");
        } catch (err: any) {
            setError(err?.message || String(err));
        } finally {
            setDeleting(false);
        }
    };

    const handleFetchAllUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await fetch(`${apiUrl}/allusers`, {
                credentials: "include",
                cache: "no-store",
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`${res.status} ${txt}`);
            }
            const data = await res.json();
            setAllUsers(data);
            setShowAllUsers(true);
            setError(null);
        } catch (err: any) {
            setError(err?.message || String(err));
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleGenerateResetToken = async (userId: number) => {
        setGeneratingToken(userId);
        try {
            const res = await fetch(`${apiUrl}/admin/password-reset-token?user_id=${userId}&expires_minutes=60`, {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`${res.status} ${txt}`);
            }
            const data = await res.json();
            setResetTokens(new Map(resetTokens.set(userId, { token: data.token, expires_at: data.expires_at })));
            setError(null);
        } catch (err: any) {
            setError(err?.message || String(err));
        } finally {
            setGeneratingToken(null);
        }
    };

    const handleCopyResetToken = async (token: string, userId: number) => {
        await navigator.clipboard.writeText(token);
        setCopiedTokenId(userId);
        setTimeout(() => setCopiedTokenId(null), 2000);
    };

    if (loading) return <div className="p-8 text-center">Loading profile...</div>;
    if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
    if (!profile) return <div className="p-8 text-center">No profile data</div>;

    const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

    return (
        <div className="mx-auto max-w-3xl p-8">
            {
                !editing ? (
                    <div>

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
                                        className="px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors flex items-center gap-2"
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
                            <div>
                                <button
                                    onClick={() => setEditing(!editing)}
                                    className="px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors flex items-center gap-2"
                                >
                                    {editing ? "Stop Editing" : "Edit Profile"}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mb-8">
                            Edit Profile
                        </h1>
                        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Username</label>
                                <input
                                    type="text"
                                    value={updateData!.username}
                                    onChange={(e) => setUpdateData({ ...updateData!, username: e.target.value })}
                                    className="mt-1 block w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">First Name</label>
                                <input
                                    type="text"
                                    value={updateData!.first_name}
                                    onChange={(e) => setUpdateData({ ...updateData!, first_name: e.target.value })}
                                    className="mt-1 block w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Surname</label>
                                <input
                                    type="text"
                                    value={updateData!.surname}
                                    onChange={(e) => setUpdateData({ ...updateData!, surname: e.target.value })}
                                    className="mt-1 block w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Birthday</label>
                                <input
                                    type="date"
                                    value={updateData!.birthday}
                                    onChange={(e) => setUpdateData({ ...updateData!, birthday: e.target.value })}
                                    className="mt-1 block w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div
                            className="flex">
                                <button
                                    onClick={() => setEditing(!editing)}
                                    className="px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors flex items-center gap-2 mr-3"
                                >
                                    {editing ? "Stop Editing" : "Edit Profile"}
                                </button>
                                <button
                                    onClick={() => {
                                        UpdateUser(updateData!)
                                            .then(() => {
                                                setProfile({
                                                    ...profile,
                                                    username: updateData!.username,
                                                    first_name: updateData!.first_name,
                                                    surname: updateData!.surname,
                                                    birthday: updateData!.birthday,
                                                });
                                                setEditing(false);
                                            })
                                            .catch((err) => {
                                                setError(err?.message || String(err));
                                            });
                                    }
                                    }
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {
                profile.is_admin && (
                    <div className="mt-6">
                        <div className="flex gap-2">
                            <button 
                                className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800"
                                onClick={handleFetchAllUsers}
                                disabled={loadingUsers}
                            >
                                {loadingUsers ? "Loading..." : showAllUsers ? "Refresh All Users" : "Show All Users"}
                            </button>
                            {showAllUsers && (
                                <button 
                                    className="px-4 py-2 bg-zinc-600 text-white rounded-lg text-sm font-medium hover:bg-zinc-700"
                                    onClick={() => setShowAllUsers(false)}
                                >
                                    Hide Users
                                </button>
                            )}
                        </div>
                        
                        {showAllUsers && allUsers.length > 0 && (
                            <div className="mt-6 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-zinc-50 dark:bg-zinc-700">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">ID</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Username</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Name</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Birthday</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Admin</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                                            {allUsers.map((user) => (
                                                <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
                                                    <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">{user.id}</td>
                                                    <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">{user.username}</td>
                                                    <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">
                                                        {capitalize(user.first_name)} {capitalize(user.surname)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">{user.birthday}</td>
                                                    <td className="px-4 py-3 text-sm">
                                                        {user.is_admin ? (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                                Yes
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-400">
                                                                No
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <div className="flex flex-col gap-2">
                                                            <button
                                                                onClick={() => handleGenerateResetToken(user.id)}
                                                                disabled={generatingToken === user.id}
                                                                className="px-3 py-1 bg-amber-500 text-white rounded text-xs font-medium hover:bg-amber-600 disabled:opacity-50"
                                                            >
                                                                {generatingToken === user.id ? "Generating..." : "Reset Password"}
                                                            </button>
                                                            {resetTokens.has(user.id) && (
                                                                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded p-2">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <code className="text-xs font-mono text-orange-900 dark:text-orange-100 break-all">
                                                                            {resetTokens.get(user.id)!.token}
                                                                        </code>
                                                                        <button
                                                                            onClick={() => handleCopyResetToken(resetTokens.get(user.id)!.token, user.id)}
                                                                            className="px-2 py-1 bg-amber-500 text-white rounded text-xs hover:bg-amber-600 shrink-0"
                                                                        >
                                                                            {copiedTokenId === user.id ? "Copied!" : "Copy"}
                                                                        </button>
                                                                    </div>
                                                                    <p className="text-xs text-orange-700 dark:text-orange-300">
                                                                        Expires: {new Date(resetTokens.get(user.id)!.expires_at * 1000).toLocaleString()}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )
            }
            <div className="mt-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Danger Zone</h2>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                    Deleting your account is permanent and cannot be undone.
                </p>


                {deleteStep === 0 && (
                    <button
                        onClick={() => setDeleteStep(1)}
                        className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600"
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
                                    className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600"
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
                                    className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
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