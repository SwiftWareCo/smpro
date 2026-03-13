"use client";

import { createContext, useContext } from "react";
import type { Id } from "@/convex/_generated/dataModel";

interface PortalClientContextValue {
    clientId: Id<"clients">;
    clientName: string;
}

const PortalClientContext = createContext<PortalClientContextValue | null>(null);

export function PortalClientProvider({
    clientId,
    clientName,
    children,
}: {
    clientId: Id<"clients">;
    clientName: string;
    children: React.ReactNode;
}) {
    return (
        <PortalClientContext.Provider value={{ clientId, clientName }}>
            {children}
        </PortalClientContext.Provider>
    );
}

export function usePortalClient(): PortalClientContextValue {
    const ctx = useContext(PortalClientContext);
    if (!ctx) {
        throw new Error(
            "usePortalClient must be used within a PortalClientProvider",
        );
    }
    return ctx;
}
