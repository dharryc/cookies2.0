"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import apiUrl from "@/components/apiUrl";

type Item = {
    id: number;
    item_name: string;
    link: string;
    description: string;
    purchased: boolean;
    purchased_by: number | null;
    upper_price: number;
    lower_price: number;
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
                
                if (infoRes.ok) {
                    const info: PodInfo = await infoRes.json();
                    setPodName(info.name || "Pod Details");
                    
                    // Create a map of user ID to name
                    const memberMap = new Map<number, string>();
                    info.members.forEach(member => {
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
        if (sortBy === "none") return items;
        return [...items].sort((a, b) => {
            const avgA = (a.lower_price + a.upper_price) / 2;
            const avgB = (b.lower_price + b.upper_price) / 2;
            return sortBy === "price-low" ? avgA - avgB : avgB - avgA;
        });
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

    return (
        <div className="w-full p-4 md:p-8 pb-20 md:pb-8 flex flex-col items-center">
            <div className="w-full max-w-[1200px] mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                    {podName}
                </h1>
                <div className="flex items-center gap-2 md:gap-3">
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
            <div className="w-full max-w-[1200px] space-y-6 md:space-y-8">
                {Object.entries(podData).map(([memberName, memberData]) => {
                    const [firstName, lastName] = memberName.split("|");
                    const capitalize = (str: string) => 
                        str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
                    const sortedItems = sortItems(memberData.items);
                    const daysUntilBirthday = getDaysUntilBirthday(memberData.birthday);
                    return (
                        <div key={memberName} className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-4 md:p-6">
                            <div className="mb-4 md:mb-6 pb-3 md:pb-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                                <div className="flex-1"></div>
                                <h2 className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 flex-1 text-center">
                                    {capitalize(firstName)} {capitalize(lastName)}
                                </h2>
                                <div className="flex-1 flex justify-end">
                                    {daysUntilBirthday !== null && (
                                        <span className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400">
                                            {daysUntilBirthday === 0 ? (
                                                <span className="font-medium text-purple-600 dark:text-purple-400">Birthday today!</span>
                                            ) : daysUntilBirthday === 1 ? (
                                                <span className="font-medium text-purple-600 dark:text-purple-400">Birthday tomorrow!</span>
                                            ) : (
                                                <span>Birthday in {daysUntilBirthday} days</span>
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {sortedItems.length === 0 ? (
                                <div className="text-center py-6 md:py-8 text-zinc-500 dark:text-zinc-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 opacity-50">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                    </svg>
                                    <p className="text-sm">No items added to this pod yet</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                    {sortedItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="rounded-lg border border-zinc-200 bg-white p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow dark:border-zinc-700 dark:bg-zinc-800 flex flex-col min-h-[200px]"
                                    >
                                        {item.link ? (
                                            <a
                                                href={item.link.startsWith("http") ? item.link : `https://${item.link}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-base md:text-lg font-semibold text-blue-600 hover:underline mb-2 md:mb-3 block leading-tight"
                                            >
                                                {item.item_name || "View Item"}
                                            </a>
                                        ) : (
                                            <h3 className="text-base md:text-lg font-semibold text-zinc-900 dark:text-white mb-2 md:mb-3 leading-tight">
                                                {item.item_name || "Untitled Item"}
                                            </h3>
                                        )}
                                        <div className="flex-1 mb-3 md:mb-4">
                                            <div className="text-sm text-zinc-700 dark:text-zinc-400 mb-2 line-clamp-3">
                                                {item.description || "No description"}
                                            </div>
                                            {(item.lower_price !== null && item.upper_price !== null) && (
                                                <div className="text-xs text-zinc-500 dark:text-zinc-500">
                                                    <span className="font-medium">Price:</span> $
                                                    {item.lower_price} - ${item.upper_price}
                                                </div>
                                            )}
                                        </div>
                                        <div className="pt-2 md:pt-3 border-t border-zinc-200 dark:border-zinc-700">
                                            {item.purchased_by ? (
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 md:w-5 md:h-5 shrink-0">
                                                                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                                                            </svg>
                                                            <span className="text-xs md:text-sm font-medium">Purchased</span>
                                                        </div>
                                                        <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-6 md:ml-7">
                                                            by {podMembers.get(item.purchased_by) || "Unknown"}
                                                        </span>
                                                    </div>
                                                    {item.purchased_by === currentUserId && (
                                                        <button 
                                                            onClick={() => handleTogglePurchased(item.id, true)}
                                                            disabled={markingPurchased === item.id}
                                                            className="text-xs text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 disabled:opacity-50 shrink-0"
                                                        >
                                                            {markingPurchased === item.id ? "Updating..." : "Unmark"}
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => handleTogglePurchased(item.id, false)}
                                                    disabled={markingPurchased === item.id}
                                                    className="w-full bg-blue-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded text-xs md:text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {markingPurchased === item.id ? "Marking..." : "Mark as Purchased"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}