import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import apiUrl from "../components/apiUrl";

type Item = {
    id: number;
    item_name: string;
    link: string;
    description: string;
    purchased: boolean;
    purchased_by: number | null;
    upper_price: number;
    lower_price: number;
    item_priority: number;
};

type MemberData = {
    birthday: string;
    items: Item[];
};

type PodDetails = {
    [memberName: string]: MemberData;
};

type PodMember = {
    id: number;
    name: string;
};

type PodInfo = {
    id: number;
    name: string;
    owner_id: number;
    members: PodMember[];
};

type SortOption = "none" | "price-low" | "price-high";

type Priority = "high" | "medium" | "low";

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

export default function PodPage() {
    const params = useParams();
    const podId = params.id;
    const [podData, setPodData] = useState<PodDetails | null>(null);
    const [podName, setPodName] = useState<string>("Pod Details");
    const [podMembers, setPodMembers] = useState<Map<number, string>>(new Map());
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [markingPurchased, setMarkingPurchased] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState<SortOption>("none");
    const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
    const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set());
    
    // Pod management state
    const [podInfo, setPodInfo] = useState<PodInfo | null>(null);
    const [isOwner, setIsOwner] = useState(false);
    const [showManagement, setShowManagement] = useState(false);
    const [memberIdsToAdd, setMemberIdsToAdd] = useState("");
    const [memberIdsToRemove, setMemberIdsToRemove] = useState<number[]>([]);
    const [managingMembers, setManagingMembers] = useState(false);
    const [generatedInvite, setGeneratedInvite] = useState<{code: string, link: string, expires_at: number} | null>(null);
    const [generatingInvite, setGeneratingInvite] = useState(false);
    const [inviteMsg, setInviteMsg] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingPod, setDeletingPod] = useState(false);

    const toggleMember = (memberName: string) => {
        setExpandedMembers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(memberName)) {
                newSet.delete(memberName);
            } else {
                newSet.add(memberName);
            }
            return newSet;
        });
    };

    const toggleDescription = (itemId: number) => {
        setExpandedDescriptions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    useEffect(() => {
        const fetchPodDetails = async () => {
            try {
                const [detailsRes, infoRes, profileRes] = await Promise.all([
                    fetch(`${apiUrl}/pod/${podId}`, {
                        credentials: "include",
                        cache: "no-store",
                    }),
                    fetch(`${apiUrl}/pod/info/${podId}`, {
                        credentials: "include",
                        cache: "no-store",
                    }),
                    fetch(`${apiUrl}/profile`, {
                        credentials: "include",
                        cache: "no-store",
                    })
                ]);
                
                if (!detailsRes.ok) {
                    const txt = await detailsRes.text();
                    throw new Error(`${detailsRes.status} ${txt}`);
                }
                
                const data = await detailsRes.json();
                setPodData(data);
                
                let info: PodInfo | null = null;
                if (infoRes.ok) {
                    info = await infoRes.json();
                    setPodName(info?.name || "Pod Details");
                    setPodInfo(info);
                    
                    // Create a map of user ID to name
                    const memberMap = new Map<number, string>();
                    info?.members.forEach(member => {
                        const [firstName, lastName] = member.name.split("|");
                        const capitalize = (str: string) => 
                            str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
                        memberMap.set(member.id, `${capitalize(firstName)} ${capitalize(lastName)}`);
                    });
                    setPodMembers(memberMap);
                }
                
                if (profileRes.ok) {
                    const profile = await profileRes.json();
                    setCurrentUserId(profile.id);
                    
                    // Check if user owns this pod
                    if (info) {
                        setIsOwner(profile.id === info.owner_id);
                    }
                }
                
                setError(null);
            } catch (err: any) {
                setError(err?.message || String(err));
            } finally {
                setLoading(false);
            }
        };

        if (podId) {
            fetchPodDetails();
        }
    }, [podId]);

    const handleTogglePurchased = async (itemId: number, currentlyPurchased: boolean) => {
        if (!podId) return;
        
        setMarkingPurchased(itemId);
        try {
            const endpoint = currentlyPurchased 
                ? `${apiUrl}/item/purchased?item_id=${itemId}&pod_id=${podId}`
                : `${apiUrl}/item/purchased?item_id=${itemId}&pod_id=${podId}`;
            
            const res = await fetch(endpoint, {
                method: currentlyPurchased ? "DELETE" : "POST",
                credentials: "include",
            });
            
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`${res.status} ${txt}`);
            }
            
            // Refetch pod data to update UI
            const refreshRes = await fetch(`${apiUrl}/pod/${podId}`, {
                credentials: "include",
                cache: "no-store",
            });
            if (refreshRes.ok) {
                const data = await refreshRes.json();
                setPodData(data);
            }
        } catch (err: any) {
            setError(err?.message || String(err));
        } finally {
            setMarkingPurchased(null);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading pod details...</div>;
    if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
    if (!podData) return <div className="p-8 text-center">No data found</div>;

    const sortItems = (items: Item[]): Item[] => {
        // Separate purchased and unpurchased items
        const unpurchased = items.filter(item => !item.purchased && !item.purchased_by);
        const purchased = items.filter(item => item.purchased || item.purchased_by);
        
        // Sort unpurchased items by priority (high=2, medium=1, low=0)
        const sortedUnpurchased = [...unpurchased].sort((a, b) => b.item_priority - a.item_priority);
        
        // Apply additional sorting if selected (only to unpurchased items)
        let finalUnpurchased = sortedUnpurchased;
        if (sortBy !== "none") {
            finalUnpurchased = sortedUnpurchased.sort((a, b) => {
                const avgA = (a.lower_price + a.upper_price) / 2;
                const avgB = (b.lower_price + b.upper_price) / 2;
                return sortBy === "price-low" ? avgA - avgB : avgB - avgA;
            });
        }
        
        // Return unpurchased first, then purchased
        return [...finalUnpurchased, ...purchased];
    };

    const getDaysUntilBirthday = (birthday: string): number | null => {
        if (!birthday) return null;
        
        const today = new Date();
        const birthDate = new Date(birthday);
        
        // Set this year's birthday
        const thisYearBirthday = new Date(
            today.getFullYear(),
            birthDate.getMonth(),
            birthDate.getDate()
        );
        
        // If birthday has passed this year, calculate for next year
        const nextBirthday = thisYearBirthday < today
            ? new Date(
                today.getFullYear() + 1,
                birthDate.getMonth(),
                birthDate.getDate()
            )
            : thisYearBirthday;
        
        // Calculate days difference
        const diffTime = nextBirthday.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    };

    const handleGenerateInvite = async (expiresMinutes: number = 30) => {
        if (!podId) return;
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
            setInviteMsg("Invite code generated! Share the code below.");
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
            setInviteMsg("Invite code copied to clipboard");
        } catch (err: any) {
            console.error("Failed to copy invite code", err);
            setInviteMsg("Failed to copy invite code");
        }
    };

    const handleAddMembers = async () => {
        if (!podId || !memberIdsToAdd.trim()) {
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
            const res = await fetch(`${apiUrl}/pod/members?pod_id=${podId}`, {
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
            
            // Refresh pod info
            const infoRes = await fetch(`${apiUrl}/pod/info/${podId}`, {
                credentials: "include",
            });
            if (infoRes.ok) {
                const info = await infoRes.json();
                setPodInfo(info);
                const memberMap = new Map<number, string>();
                info.members.forEach((member: PodMember) => {
                    const [firstName, lastName] = member.name.split("|");
                    const capitalize = (str: string) => 
                        str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
                    memberMap.set(member.id, `${capitalize(firstName)} ${capitalize(lastName)}`);
                });
                setPodMembers(memberMap);
            }
        } catch (err: any) {
            setError(err?.message || String(err));
        } finally {
            setManagingMembers(false);
        }
    };

    const handleRemoveMembers = async () => {
        if (!podId || memberIdsToRemove.length === 0) {
            setError("Please select members to remove");
            return;
        }

        setManagingMembers(true);
        setError(null);
        try {
            const res = await fetch(`${apiUrl}/pod/members?pod_id=${podId}`, {
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
            
            // Refresh pod info
            const infoRes = await fetch(`${apiUrl}/pod/info/${podId}`, {
                credentials: "include",
            });
            if (infoRes.ok) {
                const info = await infoRes.json();
                setPodInfo(info);
                const memberMap = new Map<number, string>();
                info.members.forEach((member: PodMember) => {
                    const [firstName, lastName] = member.name.split("|");
                    const capitalize = (str: string) => 
                        str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
                    memberMap.set(member.id, `${capitalize(firstName)} ${capitalize(lastName)}`);
                });
                setPodMembers(memberMap);
            }
        } catch (err: any) {
            setError(err?.message || String(err));
        } finally {
            setManagingMembers(false);
        }
    };

    const toggleMemberRemoval = (userId: number) => {
        setMemberIdsToRemove(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleDeletePod = async () => {
        if (!podId) return;

        setDeletingPod(true);
        setError(null);
        try {
            const res = await fetch(`${apiUrl}/pod?pod_id=${podId}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`${res.status} ${txt}`);
            }
            // Redirect to home page after deletion
            window.location.href = "/";
        } catch (err: any) {
            setError(err?.message || String(err));
        } finally {
            setDeletingPod(false);
        }
    };

    return (
        <div className="w-full p-4 md:p-8 pb-20 md:pb-8 flex flex-col items-center">
            <div className="w-full max-w-[1200px] mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                    {podName}
                </h1>
                <div className="flex items-center gap-2 md:gap-3">
                    {isOwner && (
                        <button
                            onClick={() => setShowManagement(!showManagement)}
                            className="px-3 py-1.5 text-sm font-medium bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
                        >
                            {showManagement ? "Hide" : "Manage Pod"}
                        </button>
                    )}
                    <label htmlFor="sort" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Sort:
                    </label>
                    <select
                        id="sort"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="px-2 md:px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="none">None</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                    </select>
                </div>
            </div>
            
            {/* Pod Management Section - Only visible to owner */}
            {isOwner && showManagement && podInfo && (
                <div className="w-full max-w-[1200px] mb-6 md:mb-8 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6 space-y-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Pod Management</h2>
                    
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                        </div>
                    )}
                    
                    {/* Generate Invite */}
                    <div>
                        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Invite Members</h3>
                        <button
                            onClick={() => handleGenerateInvite(30)}
                            disabled={generatingInvite}
                            className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 disabled:opacity-50"
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
                                        className="px-3 py-1 bg-purple-500 text-white rounded text-xs font-medium hover:bg-purple-600"
                                    >
                                        Copy
                                    </button>
                                </div>
                                <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">
                                    Expires: {new Date(generatedInvite.expires_at * 1000).toLocaleString()}
                                </p>
                            </div>
                        )}
                        {inviteMsg && (
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">{inviteMsg}</p>
                        )}
                    </div>

                    {/* Add Members */}
                    <div>
                        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Add Members by ID</h3>
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
                                className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50"
                            >
                                {managingMembers ? "Adding..." : "Add"}
                            </button>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            Users can find their ID on their profile page
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
                                className="mt-3 w-full px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 disabled:opacity-50"
                            >
                                {managingMembers ? "Removing..." : `Remove ${memberIdsToRemove.length} Member${memberIdsToRemove.length > 1 ? 's' : ''}`}
                            </button>
                        )}
                    </div>
                </div>
            )}
            
            <div className="w-full max-w-[1200px] space-y-6 md:space-y-8">
                {Object.entries(podData).map(([memberName, memberData]) => {
                    const [firstName, lastName] = memberName.split("|");
                    const capitalize = (str: string) => 
                        str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
                    const sortedItems = sortItems(memberData.items);
                    const daysUntilBirthday = getDaysUntilBirthday(memberData.birthday);
                    const isExpanded = expandedMembers.has(memberName);
                    return (
                        <div key={memberName} className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden">
                            <button
                                onClick={() => toggleMember(memberName)}
                                className="w-full p-4 md:p-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        viewBox="0 0 24 24" 
                                        fill="currentColor" 
                                        className={`w-5 h-5 md:w-6 md:h-6 text-zinc-600 dark:text-zinc-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                    >
                                        <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z" clipRule="evenodd" />
                                    </svg>
                                    <h2 className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                                        {capitalize(firstName)} {capitalize(lastName)}
                                    </h2>
                                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                        ({sortedItems.length} {sortedItems.length === 1 ? 'item' : 'items'})
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    {daysUntilBirthday !== null && (
                                        <span className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400">
                                            {daysUntilBirthday === 0 ? (
                                                <span className="font-medium text-purple-600 dark:text-purple-400">🎂 Birthday today!</span>
                                            ) : daysUntilBirthday === 1 ? (
                                                <span className="font-medium text-purple-600 dark:text-purple-400">Birthday tomorrow!</span>
                                            ) : (
                                                <span>Birthday in {daysUntilBirthday} days</span>
                                            )}
                                        </span>
                                    )}
                                </div>
                            </button>
                            {isExpanded && (
                            <div className="p-4 md:p-6 pt-0">
                            {sortedItems.length === 0 ? (
                                <div className="text-center py-6 md:py-8 text-zinc-500 dark:text-zinc-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 opacity-50">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                    </svg>
                                    <p className="text-sm">No items added to this pod yet</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                    {sortedItems.map((item) => {
                                        const priority = item.item_priority === 2 ? "high" : item.item_priority === 1 ? "medium" : "low";
                                        const priorityStyles = getPriorityStyles(priority);
                                        const isPurchased = item.purchased_by || item.purchased;
                                        
                                        // Button colors based on priority
                                        const buttonColors = {
                                            high: "bg-green-300 hover:bg-green-400 dark:bg-green-700 dark:hover:bg-green-600 text-zinc-900 dark:text-white",
                                            medium: "bg-yellow-400 hover:bg-yellow-500 dark:bg-yellow-600 dark:hover:bg-yellow-500 text-zinc-900 dark:text-white",
                                            low: "bg-red-300 hover:bg-red-400 dark:bg-red-700 dark:hover:bg-red-600 text-zinc-900 dark:text-white"
                                        };
                                        
                                        return (
                                    <div
                                        key={item.id}
                                        className={`rounded-lg border-2 p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col min-h-[200px] ${
                                            isPurchased 
                                                ? 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800' 
                                                : `${priorityStyles.border} ${priorityStyles.bg}`
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex-1">
                                        {item.link ? (
                                            <a
                                                href={item.link.startsWith("http") ? item.link : `https://${item.link}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-base md:text-lg font-semibold text-blue-500 hover:underline block leading-tight"
                                            >
                                                {item.item_name || "View Item"}
                                            </a>
                                        ) : (
                                            <h3 className="text-base md:text-lg font-semibold text-zinc-900 dark:text-white leading-tight">
                                                {item.item_name || "Untitled Item"}
                                            </h3>
                                        )}
                                            </div>
                                            
                                            {/* Priority Badge - only show if not purchased */}
                                            {!isPurchased && (
                                                <span className={`whitespace-nowrap text-xs font-semibold px-2 py-1 rounded-full ${priorityStyles.badge}`}>
                                                    {priorityStyles.label}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 mb-3 md:mb-4">
                                            {item.description && item.description.length > 150 ? (
                                                <div className="text-sm text-zinc-700 dark:text-zinc-400 mb-2">
                                                    <div className={expandedDescriptions.has(item.id) ? "" : "line-clamp-3"}>
                                                        {item.description}
                                                    </div>
                                                    <button
                                                        onClick={() => toggleDescription(item.id)}
                                                        className="text-xs text-blue-500 dark:text-blue-400 hover:underline mt-1"
                                                    >
                                                        {expandedDescriptions.has(item.id) ? "Show less" : "Read more"}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-zinc-700 dark:text-zinc-400 mb-2">
                                                    {item.description || "No description"}
                                                </div>
                                            )}
                                            {(item.lower_price !== null && item.upper_price !== null && (item.lower_price > 0 || item.upper_price > 0)) ? (
                                                <div className="text-xs text-zinc-500 dark:text-zinc-500">
                                                    <span className="font-medium">Price:</span> $
                                                    {item.lower_price.toLocaleString()} - ${item.upper_price.toLocaleString()}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-zinc-500 dark:text-zinc-500 italic">
                                                    <span className="font-medium">Price:</span> No price specified
                                                </div>
                                            )}
                                        </div>
                                        <div className="pt-2 md:pt-3 border-t border-zinc-200 dark:border-zinc-700">
                                            {item.purchased_by || item.purchased ? (
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 md:w-5 md:h-5 shrink-0">
                                                                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                                                            </svg>
                                                            <span className="text-xs md:text-sm font-medium">Purchased</span>
                                                        </div>
                                                        <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-6 md:ml-7">
                                                            {item.purchased_by ? `by ${ podMembers.get(item.purchased_by) || "Unknown"}` : "by someone in another pod"}
                                                        </span>
                                                    </div>
                                                    {item.purchased_by === currentUserId && (
                                                        <button 
                                                            onClick={() => handleTogglePurchased(item.id, true)}
                                                            disabled={markingPurchased === item.id}
                                                            className="text-xs bg-rose-400 hover:bg-rose-500 dark:bg-rose-500 rounded px-2 py-1.5 md:px-2.5 md:py-2 dark:hover:bg-rose-400 disabled:opacity-50 shrink-0 text-white font-medium"
                                                        >
                                                            {markingPurchased === item.id ? "Updating..." : "Unmark"}
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => handleTogglePurchased(item.id, false)}
                                                    disabled={markingPurchased === item.id}
                                                    className={`w-full text-white px-3 md:px-4 py-1.5 md:py-2 rounded text-xs md:text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${buttonColors[priority]}`}
                                                >
                                                    {markingPurchased === item.id ? "Marking..." : "Mark as Purchased"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                                })}
                                </div>
                            )}
                            </div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            {/* Delete Pod Section - Only visible to owner */}
            {isOwner && podInfo && (
                <div className="w-full max-w-[1200px] mt-8 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800 p-6">
                    <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Danger Zone</h2>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                        Deleting this pod will permanently remove it and all member associations. This action cannot be undone.
                    </p>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600"
                    >
                        Delete Pod
                    </button>
                </div>
            )}
            
            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 max-w-md w-full">
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Delete Pod?</h2>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                            This will permanently delete "{podName}" and remove all members. This action cannot be undone.
                        </p>
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <button
                                onClick={handleDeletePod}
                                disabled={deletingPod}
                                className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 disabled:opacity-50"
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
    );
}