import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiUrl from "../components/apiUrl";

export default function PasswordReset() {
    const navigate = useNavigate();
    const [token, setToken] = useState("");
    const [username, setUsername] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        // Validate password length
        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${apiUrl}/password-reset`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token: token,
                    username: username,
                    new_password: newPassword,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.detail || `Reset failed (${res.status})`);
            }

            setSuccess(true);
            setTimeout(() => {
                navigate("/welcome");
            }, 2000);
        } catch (err: any) {
            setError(err?.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4 py-12">
            <div className="w-full max-w-md">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                        Reset Password
                    </h1>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        Enter your reset token and new password
                    </p>
                </div>

                <div className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="token" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                Reset Token
                            </label>
                            <input
                                id="token"
                                type="text"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="w-full rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
                                required
                                placeholder="Enter your reset token"
                            />
                        </div>

                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
                                required
                                placeholder="Enter your username"
                            />
                        </div>

                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                New Password
                            </label>
                            <input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
                                required
                                placeholder="Enter new password"
                                minLength={8}
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
                                required
                                placeholder="Confirm new password"
                                minLength={8}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || success}
                            className="w-full rounded bg-sky-500 px-4 py-2 text-white font-medium hover:bg-sky-600 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? "Resetting..." : success ? "Success!" : "Reset Password"}
                        </button>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    Password reset successfully! Redirecting to login...
                                </p>
                            </div>
                        )}

                        <div className="text-center text-sm text-zinc-600 dark:text-zinc-400">
                            Remember your password?{" "}
                            <a href="/welcome" className="text-blue-600 hover:underline dark:text-blue-400">
                                Back to login
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
