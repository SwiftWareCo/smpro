"use client";

import { useOrganizationList } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Building2, Loader2, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Org {
    id: string;
    name: string;
    slug: string | null;
    imageUrl: string;
}

export function OrgList({
    orgs,
    canAccessAdmin = false,
}: {
    orgs: Org[];
    canAccessAdmin?: boolean;
}) {
    const router = useRouter();
    const { isLoaded, setActive } = useOrganizationList();
    const [activatingId, setActivatingId] = useState<string | null>(null);

    async function handleSelect(org: Org) {
        if (!isLoaded || !setActive) return;
        setActivatingId(org.id);
        try {
            await setActive({ organization: org.id });
            router.push("/portal");
        } catch {
            setActivatingId(null);
        }
    }

    useEffect(() => {
        if (
            orgs.length !== 1 ||
            canAccessAdmin ||
            activatingId !== null ||
            !isLoaded ||
            !setActive
        ) {
            return;
        }

        const onlyOrg = orgs[0];
        setActivatingId(onlyOrg.id);
        void setActive({ organization: onlyOrg.id })
            .then(() => {
                router.push("/portal");
            })
            .catch(() => {
                setActivatingId(null);
            });
    }, [activatingId, canAccessAdmin, isLoaded, orgs, router, setActive]);

    if (orgs.length === 0 && !canAccessAdmin) {
        return (
            <Card>
                <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">
                        You are not a member of any organization.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            {canAccessAdmin && (
                <Link href="/admin" className="block">
                    <Card className="cursor-pointer transition-colors hover:bg-muted/50 hover:border-primary/30">
                        <CardContent className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                <Shield className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-medium text-foreground truncate">
                                    Admin Console
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    Agency dashboard and client management
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            )}
            {orgs.map((org) => (
                <button
                    key={org.id}
                    type="button"
                    className="w-full text-left"
                    disabled={activatingId !== null}
                    onClick={() => handleSelect(org)}
                >
                    <Card className="cursor-pointer transition-colors hover:bg-muted/50 hover:border-primary/30">
                        <CardContent className="flex items-center gap-4">
                            {org.imageUrl ? (
                                <img
                                    src={org.imageUrl}
                                    alt={org.name}
                                    className="h-10 w-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                    <Building2 className="h-5 w-5 text-primary" />
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="font-medium text-foreground truncate">
                                    {org.name}
                                </p>
                                {org.slug && (
                                    <p className="text-xs text-muted-foreground truncate">
                                        {org.slug}
                                    </p>
                                )}
                            </div>
                            {activatingId === org.id && (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                        </CardContent>
                    </Card>
                </button>
            ))}
        </div>
    );
}
