import React, { useState } from "react";
import apiUrl from "./apiUrl";
import PodCreateDTO from "../models/podCreationdto";

function CreatePodForm() {
    const [name, setName] = useState("");
    const [membersEnabled, setMembersEnabled] = useState(false);
    const [memberInput, setMemberInput] = useState("");
    const [members, setMembers] = useState<number[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

        function addMember() {
            const trimmed = memberInput.trim();
            if (trimmed === "") return;
            // Accept a single integer or comma/space separated list
            const parts = trimmed.split(/[,\s]+/).filter(Boolean);
            const parsedIds: number[] = [];
            for (const p of parts) {
                if (!/^\d+$/.test(p)) {
                    setMessage("Member IDs must be integers (digits only)");
                    return;
                }
                const n = parseInt(p, 10);
                if (members.includes(n) || parsedIds.includes(n)) continue;
                parsedIds.push(n);
            }
            if (parsedIds.length === 0) {
                setMessage("No valid member IDs to add");
                return;
            }
            setMembers((s) => [...s, ...parsedIds]);
            setMemberInput("");
            setMessage(null);
        }

    function removeMember(idx: number) {
        setMembers((s) => s.filter((_, i) => i !== idx));
    }

    // No pending info UI — we'll validate pending member input at submit time

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMessage(null);
        // Prevent submitting if the user has typed IDs into the member input but not added them
        if (membersEnabled && memberInput.trim() !== "") {
            setMessage("You have member IDs in the input field. Click 'Add' to add them, or clear the field before submitting.");
            return;
        }
        if (!name.trim()) {
            setMessage("Name is required");
            return;
        }
        setSubmitting(true);
        try {
            // Build DTO according to PodCreateDTO
            const dto = new PodCreateDTO(name.trim(), members.length ? members : undefined);
            // Attempt to POST to backend; replace endpoint as needed.
            const res = await fetch(`${apiUrl}/new/pod`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(dto),
            });
            if (!res.ok) {
                setMessage(`Something went wrong creating the pod! Please check all member IDs are valid.\n (or ask Harry what's wrong)`);
            } else {
                setMessage("Pod created successfully");
                setName("");
                setMembers([]);
                setMembersEnabled(false);
            }
        } catch (err) {
            console.error(err);
            setMessage("Network error");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="mx-auto max-w-md bg-white rounded-lg p-6 shadow-sm dark:bg-zinc-900">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Pod Name</label>
            <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded border border-zinc-200 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:border-zinc-700"
                placeholder="Enter pod name"
                required
            />

            <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-zinc-600 dark:text-zinc-400">Members (optional)</div>
                <button
                    type="button"
                    onClick={() => setMembersEnabled((s) => !s)}
                    className="text-sm text-blue-600 hover:underline"
                >
                    {membersEnabled ? "Hide member inputs" : "Add members by id"}
                </button>
            </div>

            {membersEnabled && (
                <div className="mt-3">
                    <div className="flex gap-2">
                        <input
                            value={memberInput}
                            onChange={(e) => setMemberInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMember(); } }}
                            className="flex-1 rounded border border-zinc-200 px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:border-zinc-700"
                            placeholder="Enter member id (integer)"
                        />
                        <button type="button" onClick={addMember} className="rounded bg-zinc-100 px-3 py-2 text-sm hover:bg-zinc-200 dark:bg-zinc-800">
                            Add
                        </button>
                    </div>

                    {members.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {members.map((m, i) => (
                                <div key={i} className="inline-flex items-center gap-2 rounded bg-zinc-100 px-2 py-1 text-sm dark:bg-zinc-800">
                                    <span className="font-mono">{m}</span>
                                    <button type="button" onClick={() => removeMember(i)} className="text-xs text-red-600 hover:underline">
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {message && <div className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">{message}</div>}

            {/* If user left IDs in the input and didn't Add them, we'll show an error on submit instead */}

            <div className="mt-6">
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded bg-sky-500 px-4 py-2 text-white hover:bg-sky-600 disabled:opacity-60"
                >
                    {submitting ? "Creating..." : "Create Pod"}
                </button>
            </div>
        </form>
    );
}

export default CreatePodForm;