"use client";

import { createContext, useContext } from "react";
import type { Id } from "@/convex/_generated/dataModel";

interface PortalClientContextValue {
    clientId: Id<"clients">;
    clientName: string;
    portalPrimaryColor?: string | null;
    portalSecondaryColor?: string | null;
}

const PortalClientContext = createContext<PortalClientContextValue | null>(null);

export function PortalClientProvider({
    clientId,
    clientName,
    portalPrimaryColor,
    portalSecondaryColor,
    children,
}: {
    clientId: Id<"clients">;
    clientName: string;
    portalPrimaryColor?: string | null;
    portalSecondaryColor?: string | null;
    children: React.ReactNode;
}) {
    return (
        <PortalClientContext.Provider value={{ clientId, clientName, portalPrimaryColor, portalSecondaryColor }}>
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
