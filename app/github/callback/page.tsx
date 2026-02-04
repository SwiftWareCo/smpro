"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function GithubCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const installationId = searchParams.get("installation_id");
        const stateParam = searchParams.get("state");
        const setupAction = searchParams.get("setup_action");

        if (!installationId || !stateParam) {
            toast.error("Invalid callback params");
            router.push("/");
            return;
        }

        try {
            const decoded = JSON.parse(atob(stateParam));
            const clientId = decoded.clientId;

            if (!clientId) throw new Error("No client ID in state");

            router.push(
                `/workspace/${clientId}?tab=autoblog&installation_id=${installationId}&setup_action=${setupAction || "install"}`,
            );
        } catch (err) {
            console.error("Failed to parse GitHub state", err);
            toast.error("Connection failed. Please try again.");
            router.push("/dashboard");
        }
    }, [searchParams, router]);

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
            <h2 className="text-xl font-semibold">Connecting GitHub...</h2>
            <p className="text-gray-500">
                Redirecting you back to your workspace.
            </p>
        </div>
    );
}
