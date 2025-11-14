"use client";
import CreatePodForm from "@/components/podCreation";

export default function PodCreation() {
    return (
        <main className="mx-auto max-w-3xl p-8">
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 text-center">
                Create a New Pod
            </h1>
            <div className="mt-6">
                <CreatePodForm />
            </div>
        </main>
    );
}