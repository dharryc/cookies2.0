import { Link, useNavigate } from "react-router-dom";

export default function WelcomePage() {
    const navigate = useNavigate();

    return (
        <main className="mx-auto max-w-4xl p-8">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">
                    Welcome to Cookies Gifts
                </h1>
                <p className="text-lg text-zinc-600 dark:text-zinc-300">
                    Let's get you started with managing your gift wishlists
                </p>
            </div>

            <div className="space-y-6">
                {/* How It Works */}
                <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                        How It Works
                    </h2>
                    <ol className="space-y-3 text-zinc-700 dark:text-zinc-300">
                        <li className="flex gap-3">
                            <span className="shrink-0 w-6 h-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                            <span>Create <strong>Items</strong> - add gifts you'd like to receive with links, descriptions, and price ranges</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="shrink-0 w-6 h-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                            <span>Join or create <strong>Pods</strong> - groups where you share wishlists with friends and family</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="shrink-0 w-6 h-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                            <span>Control visibility - choose which Pods can see each of your items</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="shrink-0 w-6 h-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full flex items-center justify-center text-sm font-bold">4</span>
                            <span>Browse and mark purchases - see what others want and mark items when you buy them</span>
                        </li>
                    </ol>
                </section>

                {/* Key Terms */}
                <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                        Key Terms
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2">Items</h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                Your personal wishlist items. Add links, descriptions, and price ranges for gifts you'd like.
                            </p>
                        </div>
                        <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2">Pods</h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                Groups of people who share wishlists. Create pods for family, friends, or coworkers.
                            </p>
                        </div>
                        <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2">Visibility</h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                Control which pods can see each item. Same item can appear in multiple pods.
                            </p>
                        </div>
                        <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2">Purchased Status</h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                Mark items when bought to prevent duplicates. Only you can unmark your purchases.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Getting Started */}
                <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                        Getting Started
                    </h2>
                    <div className="space-y-4">
                        <div className="flex gap-3 items-start">
                            <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full w-8 h-8 flex items-center justify-center shrink-0 font-bold">1</div>
                            <div>
                                <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Join or create a pod</h4>
                                <p className="text-sm text-zinc-600 dark:text-zinc-300">Use <strong>Manage Pods</strong> to create your own or join with an invite code from friends</p>
                            </div>
                        </div>
                        <div className="flex gap-3 items-start">
                            <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full w-8 h-8 flex items-center justify-center shrink-0 font-bold">2</div>
                            <div>
                                <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Add your wishlist items</h4>
                                <p className="text-sm text-zinc-600 dark:text-zinc-300">Go to <strong>Items</strong> and create gifts you'd like to receive</p>
                            </div>
                        </div>
                        <div className="flex gap-3 items-start">
                            <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full w-8 h-8 flex items-center justify-center shrink-0 font-bold">3</div>
                            <div>
                                <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Make items visible</h4>
                                <p className="text-sm text-zinc-600 dark:text-zinc-300">Edit each item and use "Manage Visibility" to choose which pods can see it</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <div className="text-center pt-4">
                    <button
                        onClick={() => navigate("/")}
                        className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm"
                    >
                        Get Started
                    </button>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-4">
                        Questions? Check out the{" "}
                        <Link to="/profile" className="text-zinc-900 dark:text-zinc-100 hover:underline font-semibold">
                            Profile page
                        </Link>
                        {" "}to find your User ID
                    </p>
                </div>
            </div>
        </main>
    );
}
