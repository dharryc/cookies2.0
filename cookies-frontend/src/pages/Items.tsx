import { useState } from "react";
import { ItemsProvider, useItems } from "../components/itemsProvider";
import { usePods } from "../components/PodsProvider";
import apiUrl from "../components/apiUrl";
import ItemDTO, { validateItemDTO } from "../models/itemDto";

type ItemType = {
    id: number;
    user_id: number;
    item_name: string;
    upper_price: number;
    lower_price: number;
    link: string;
    description: string;
    item_priority: number;
    pods: Array<{ id: number; name: string }>;
};

type Priority = "high" | "medium" | "low";

const getPriorityFromValue = (value: number): Priority => {
    return value === 2 ? "high" : value === 1 ? "medium" : "low";
};

const getPriorityStyles = (priority: Priority) => {
    switch (priority) {
        case "high":
            return { 
                border: "border-green-300 dark:border-green-700",
                bg: "bg-green-50/50 dark:bg-green-950/10",
                badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                label: "High"
            };
        case "medium":
            return { 
                border: "border-yellow-300 dark:border-yellow-500",
                bg: "bg-yellow-50/50 dark:bg-yellow-950/10",
                badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                label: "Medium"
            };
        case "low":
            return { 
                border: "border-red-300 dark:border-red-700",
                bg: "bg-red-50/50 dark:bg-red-950/10",
                badge: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                label: "Low"
            };
    }
};

function ItemCard({ item, onUpdate }: { item: ItemType; onUpdate: () => void }) {
    const { pods } = usePods();
    const [isEditing, setIsEditing] = useState(false);
    const [itemName, setItemName] = useState(item.item_name);
    const [upperPrice, setUpperPrice] = useState(item.upper_price);
    const [lowerPrice, setLowerPrice] = useState(item.lower_price);
    const [link, setLink] = useState(item.link || "");
    const [description, setDescription] = useState(item.description || "");
    const [itemPriority, setItemPriority] = useState(item.item_priority);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showPodManager, setShowPodManager] = useState(false);
    const [selectedPodIds, setSelectedPodIds] = useState<number[]>([]);
    const [savingPods, setSavingPods] = useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [showNoPriceConfirm, setShowNoPriceConfirm] = useState(false);

    const handleEdit = () => {
        setIsEditing(true);
        setError(null);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setItemName(item.item_name);
        setUpperPrice(item.upper_price);
        setLowerPrice(item.lower_price);
        setLink(item.link || "");
        setDescription(item.description || "");
        setItemPriority(item.item_priority);
        setShowNoPriceConfirm(false);
        setError(null);
    };

    const handleDelete = async () => {
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch(`${apiUrl}/item?item_id=${item.id}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`${res.status} ${txt}`);
            }
            onUpdate();
        } catch (err: any) {
            setError(err?.message || String(err));
        } finally {
            setSubmitting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleConfirm = async () => {
        const dto = new ItemDTO(itemName, upperPrice, lowerPrice, link || null, description || null, itemPriority);
        const validation = validateItemDTO(dto);
        if (!validation.valid) {
            setError(validation.error || "Validation failed");
            return;
        }

        // Check if no price and ask for confirmation
        if (dto.hasNoPrice() && !showNoPriceConfirm) {
            setShowNoPriceConfirm(true);
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch(`${apiUrl}/item?item_id=${item.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(dto),
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`${res.status} ${txt}`);
            }
            setIsEditing(false);
            onUpdate();
        } catch (err: any) {
            setError(err?.message || String(err));
        } finally {
            setSubmitting(false);
        }
    };

    const handleSavePods = async () => {
        setSavingPods(true);
        setError(null);
        try {
            // Determine which pods to add and which to remove
            const currentPodIds = item.pods.map(p => p.id);
            const toAdd = selectedPodIds.filter(id => !currentPodIds.includes(id));
            const toRemove = currentPodIds.filter(id => !selectedPodIds.includes(id));

            // Add to new pods
            const addPromises = toAdd.map(podId =>
                fetch(`${apiUrl}/item/pod?item_id=${item.id}&pod_id=${podId}`, {
                    method: "POST",
                    credentials: "include",
                })
            );

            // Remove from pods
            const removePromises = toRemove.map(podId =>
                fetch(`${apiUrl}/item/pod?item_id=${item.id}&pod_id=${podId}`, {
                    method: "DELETE",
                    credentials: "include",
                })
            );

            const results = await Promise.all([...addPromises, ...removePromises]);
            
            for (const res of results) {
                if (!res.ok) {
                    const txt = await res.text();
                    throw new Error(`${res.status} ${txt}`);
                }
            }
            
            setShowPodManager(false);
            onUpdate();
        } catch (err: any) {
            setError(err?.message || String(err));
        } finally {
            setSavingPods(false);
        }
    };

    const togglePodSelection = (podId: number) => {
        setSelectedPodIds(prev =>
            prev.includes(podId)
                ? prev.filter(id => id !== podId)
                : [...prev, podId]
        );
    };

    const openPodManager = () => {
        setSelectedPodIds(item.pods.map(p => p.id));
        setShowPodManager(true);
        setError(null);
    };

    if (isEditing) {
        const priority = getPriorityFromValue(itemPriority);
        const priorityStyles = getPriorityStyles(priority);
        
        return (
            <div className={`rounded-lg border-2 p-6 shadow-sm flex flex-col gap-3 min-h-[280px] relative ${priorityStyles.border} ${priorityStyles.bg}`}>
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={submitting}
                    className="absolute top-4 right-4 text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 disabled:opacity-50"
                    title="Delete item"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
                    </svg>
                </button>
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Item Name</label>
                    <input
                        type="text"
                        placeholder="Item Name"
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        className="border rounded px-3 py-2 text-sm dark:bg-zinc-700 dark:border-zinc-600 dark:text-zinc-100"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Upper Price</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Upper Price"
                        value={upperPrice}
                        onChange={(e) => setUpperPrice(Number(e.target.value))}
                        className="border rounded px-3 py-2 text-sm dark:bg-zinc-700 dark:border-zinc-600 dark:text-zinc-100"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Lower Price</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Lower Price"
                        value={lowerPrice}
                        onChange={(e) => setLowerPrice(Number(e.target.value))}
                        className="border rounded px-3 py-2 text-sm dark:bg-zinc-700 dark:border-zinc-600 dark:text-zinc-100"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Link (optional)</label>
                    <input
                        type="text"
                        placeholder="Link"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        className="border rounded px-3 py-2 text-sm dark:bg-zinc-700 dark:border-zinc-600 dark:text-zinc-100"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Description (optional)</label>
                    <textarea
                        placeholder="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="border rounded px-3 py-2 text-sm dark:bg-zinc-700 dark:border-zinc-600 dark:text-zinc-100 resize-none"
                        rows={3}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Priority</label>
                    <select
                        value={itemPriority}
                        onChange={(e) => setItemPriority(Number(e.target.value))}
                        className="border rounded px-3 py-2 text-sm dark:bg-zinc-700 dark:border-zinc-600 dark:text-zinc-100"
                    >
                        <option value={0}>Low</option>
                        <option value={1}>Medium</option>
                        <option value={2}>High</option>
                    </select>
                </div>
                {error && <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</div>}
                {showNoPriceConfirm && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                        <p className="text-sm text-orange-900 dark:text-orange-100 font-medium mb-2">
                            No price specified. Are you sure you want to continue?
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setShowNoPriceConfirm(false);
                                    handleConfirm();
                                }}
                                className="flex-1 bg-orange-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-orange-700"
                            >
                                Yes, Continue
                            </button>
                            <button
                                onClick={() => setShowNoPriceConfirm(false)}
                                className="flex-1 bg-zinc-300 dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100 px-3 py-1.5 rounded text-xs font-medium hover:bg-zinc-400 dark:hover:bg-zinc-500"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
                {showDeleteConfirm && (
                    <div className="absolute inset-0 bg-white/95 dark:bg-zinc-800/95 rounded-lg flex flex-col items-center justify-center p-6 backdrop-blur-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-red-600 mb-3">
                            <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-4 text-center">Delete this item?</p>
                        <div className="flex gap-2 w-full">
                            <button
                                onClick={handleDelete}
                                disabled={submitting}
                                className="flex-1 bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                            >
                                {submitting ? "Deleting..." : "Delete"}
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={submitting}
                                className="flex-1 bg-zinc-300 text-zinc-900 px-4 py-2 rounded text-sm font-medium hover:bg-zinc-400 disabled:opacity-50 dark:bg-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-500"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
                <div className="flex gap-2 mt-auto">
                    <button
                        onClick={handleConfirm}
                        disabled={submitting}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? "Saving..." : "Confirm Changes"}
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={submitting}
                        className="flex-1 bg-zinc-300 text-zinc-900 px-4 py-2 rounded text-sm font-medium hover:bg-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-500"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    const priority = getPriorityFromValue(item.item_priority);
    const priorityStyles = getPriorityStyles(priority);

    return (
        <div className={`rounded-lg border-2 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col min-h-[220px] relative ${priorityStyles.border} ${priorityStyles.bg}`}>
            <button
                onClick={() => setShowDeleteConfirm(true)}
                className="absolute top-2 right-2 text-zinc-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-500 transition-colors z-10"
                title="Delete item"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
                </svg>
            </button>
            <div className="flex items-start justify-between gap-2 mb-3 pr-6">
                <div className="flex-1">
                    {item.link ? (
                        <a
                            href={item.link.startsWith("http") ? item.link : `https://${item.link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline block font-medium"
                        >
                            {item.item_name}
                        </a>
                    ) : (
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {item.item_name}
                        </div>
                    )}
                </div>
                
                {/* Priority Badge */}
                <span className={`whitespace-nowrap text-xs font-semibold px-2 py-1 rounded-full ${priorityStyles.badge}`}>
                    {priorityStyles.label}
                </span>
            </div>
            {showDeleteConfirm && (
                <div className="absolute inset-0 bg-white/95 dark:bg-zinc-800/95 rounded-lg flex flex-col items-center justify-center p-6 backdrop-blur-sm z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-red-600 mb-3">
                        <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-4 text-center">Delete this item?</p>
                    <div className="flex gap-2 w-full">
                        <button
                            onClick={handleDelete}
                            disabled={submitting}
                            className="flex-1 bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                        >
                            {submitting ? "Deleting..." : "Delete"}
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={submitting}
                            className="flex-1 bg-zinc-300 text-zinc-900 px-4 py-2 rounded text-sm font-medium hover:bg-zinc-400 disabled:opacity-50 dark:bg-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-500"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
            <div className="flex-1 mb-4">
                {item.lower_price > 0 || item.upper_price > 0 ? (
                    <div className="text-sm text-zinc-700 dark:text-zinc-400 mb-2">
                        ${item.lower_price.toLocaleString()} - ${item.upper_price.toLocaleString()}
                    </div>
                ) : (
                    <div className="text-sm text-zinc-500 dark:text-zinc-500 mb-2 italic">
                        No price specified
                    </div>
                )}
                {item.description && item.description.length > 150 ? (
                    <div className="text-sm text-zinc-700 dark:text-zinc-300">
                        <div className={isDescriptionExpanded ? "" : "line-clamp-3"}>
                            {item.description}
                        </div>
                        <button
                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                        >
                            {isDescriptionExpanded ? "Show less" : "Read more"}
                        </button>
                    </div>
                ) : (
                    <div className="text-sm text-zinc-700 dark:text-zinc-300">
                        {item.description || "No description"}
                    </div>
                )}
            </div>
            <div className="mt-auto">
                <div className="flex gap-2 mb-2">
                    <button
                        onClick={handleEdit}
                        className="flex-1 bg-zinc-200 text-zinc-900 px-4 py-2 rounded text-sm font-medium hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
                    >
                        Edit Item
                    </button>
                    <button
                        onClick={openPodManager}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
                    >
                        Manage Visibility
                    </button>
                </div>
            </div>

            {showPodManager && (
                <div className="absolute inset-0 bg-white/95 dark:bg-zinc-800/95 rounded-lg flex flex-col p-6 backdrop-blur-sm z-10">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Manage Visibility</h3>
                    {pods.length === 0 ? (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">You're not a member of any pods yet.</p>
                    ) : (
                        <div className="flex-1 overflow-y-auto mb-4 space-y-2">
                            {pods.map(pod => (
                                <label
                                    key={pod.pod_id}
                                    className="flex items-center gap-3 p-3 rounded border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedPodIds.includes(pod.pod_id)}
                                        onChange={() => togglePodSelection(pod.pod_id)}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <span className="text-sm text-zinc-900 dark:text-zinc-100">{pod.pod_name}</span>
                                </label>
                            ))}
                        </div>
                    )}
                    {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
                    <div className="flex gap-2">
                        <button
                            onClick={handleSavePods}
                            disabled={savingPods}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {savingPods ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                            onClick={() => {
                                setShowPodManager(false);
                                setError(null);
                            }}
                            disabled={savingPods}
                            className="flex-1 bg-zinc-300 text-zinc-900 px-4 py-2 rounded text-sm font-medium hover:bg-zinc-400 disabled:opacity-50 dark:bg-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-500"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ItemsList() {
    const { items, loading, error, refetch } = useItems();
    const [isCreating, setIsCreating] = useState(false);
    const [itemName, setItemName] = useState("");
    const [upperPrice, setUpperPrice] = useState(0);
    const [lowerPrice, setLowerPrice] = useState(0);
    const [link, setLink] = useState("");
    const [description, setDescription] = useState("");
    const [itemPriority, setItemPriority] = useState(0);
    const [createError, setCreateError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showNoPriceConfirm, setShowNoPriceConfirm] = useState(false);

    const handleCreate = async () => {
        const dto = new ItemDTO(itemName, upperPrice, lowerPrice, link || null, description || null, itemPriority);
        const validation = validateItemDTO(dto);
        if (!validation.valid) {
            setCreateError(validation.error || "Validation failed");
            return;
        }

        // Check if no price and ask for confirmation
        if (dto.hasNoPrice() && !showNoPriceConfirm) {
            setShowNoPriceConfirm(true);
            return;
        }

        setSubmitting(true);
        setCreateError(null);
        try {
            const res = await fetch(`${apiUrl}/item`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(dto),
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`${res.status} ${txt}`);
            }
            setIsCreating(false);
            setItemName("");
            setUpperPrice(0);
            setLowerPrice(0);
            setLink("");
            setDescription("");
            setItemPriority(0);
            refetch();
        } catch (err: any) {
            setCreateError(err?.message || String(err));
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelCreate = () => {
        setIsCreating(false);
        setItemName("");
        setUpperPrice(0);
        setLowerPrice(0);
        setLink("");
        setDescription("");
        setItemPriority(0);
        setShowNoPriceConfirm(false);
        setCreateError(null);
    };

    if (loading) return <div className="p-8 text-center">Loading items...</div>;
    if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;

    return (
        <div className="w-full p-8">
            <div className="flex items-center justify-between mb-8 max-w-[1400px] mx-auto">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Your Items</h1>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                    </svg>
                    Add Item
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1400px] mx-auto">
                {isCreating && (
                    <div className="rounded-lg border-2 border-dashed border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600 p-6 shadow-sm flex flex-col gap-3 min-h-[280px]">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">New Item</h3>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Item Name *</label>
                            <input
                                type="text"
                                placeholder="Item Name"
                                value={itemName}
                                onChange={(e) => setItemName(e.target.value)}
                                className="border rounded px-3 py-2 text-sm dark:bg-zinc-700 dark:border-zinc-600 dark:text-zinc-100"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Upper Price</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Upper Price"
                                value={upperPrice}
                                onChange={(e) => setUpperPrice(Number(e.target.value))}
                                className="border rounded px-3 py-2 text-sm dark:bg-zinc-700 dark:border-zinc-600 dark:text-zinc-100"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Lower Price</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Lower Price"
                                value={lowerPrice}
                                onChange={(e) => setLowerPrice(Number(e.target.value))}
                                className="border rounded px-3 py-2 text-sm dark:bg-zinc-700 dark:border-zinc-600 dark:text-zinc-100"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Link (optional)</label>
                            <input
                                type="text"
                                placeholder="Link"
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                className="border rounded px-3 py-2 text-sm dark:bg-zinc-700 dark:border-zinc-600 dark:text-zinc-100"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Description (optional)</label>
                            <textarea
                                placeholder="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="border rounded px-3 py-2 text-sm dark:bg-zinc-700 dark:border-zinc-600 dark:text-zinc-100 resize-none"
                                rows={3}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Priority</label>
                            <select
                                value={itemPriority}
                                onChange={(e) => setItemPriority(Number(e.target.value))}
                                className="border rounded px-3 py-2 text-sm dark:bg-zinc-700 dark:border-zinc-600 dark:text-zinc-100"
                            >
                                <option value={0}>Low</option>
                                <option value={1}>Medium</option>
                                <option value={2}>High</option>
                            </select>
                        </div>
                        {createError && <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">{createError}</div>}
                        {showNoPriceConfirm && (
                            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                                <p className="text-sm text-orange-900 dark:text-orange-100 font-medium mb-2">
                                    No price specified. Are you sure you want to continue?
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setShowNoPriceConfirm(false);
                                            handleCreate();
                                        }}
                                        className="flex-1 bg-orange-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-orange-700"
                                    >
                                        Yes, Continue
                                    </button>
                                    <button
                                        onClick={() => setShowNoPriceConfirm(false)}
                                        className="flex-1 bg-zinc-300 dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100 px-3 py-1.5 rounded text-xs font-medium hover:bg-zinc-400 dark:hover:bg-zinc-500"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="flex gap-2 mt-auto">
                            <button
                                onClick={handleCreate}
                                disabled={submitting}
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? "Creating..." : "Create Item"}
                            </button>
                            <button
                                onClick={handleCancelCreate}
                                disabled={submitting}
                                className="flex-1 bg-zinc-300 text-zinc-900 px-4 py-2 rounded text-sm font-medium hover:bg-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-500"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
                {items.map((it) => (
                    <ItemCard key={it.id} item={it} onUpdate={refetch} />
                ))}
            </div>
        </div>
    );
}

export default function ItemsPage() {
    return (
        <ItemsProvider>
            <ItemsList />
        </ItemsProvider>
    );
}