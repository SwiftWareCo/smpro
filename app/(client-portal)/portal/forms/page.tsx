"use client";

import { useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePortalClient } from "@/components/portal/portal-client-provider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TemplateList } from "@/components/dental-forms/template-list";
import { SubmissionsList } from "@/components/dental-forms/submissions-list";
import { Loader2 } from "lucide-react";

export default function PortalFormsPage() {
    const { clientId, clientName, portalPrimaryColor, portalSecondaryColor } = usePortalClient();
    const [subTab, setSubTab] = useState("templates");
    const { isLoading, isAuthenticated } = useConvexAuth();

    const queryArgs =
        isAuthenticated && clientId ? { clientId } : ("skip" as const);
    const templates = useQuery(api.formTemplates.list, queryArgs);
    const submissions = useQuery(api.formSubmissions.list, queryArgs);

    if (
        isLoading ||
        !isAuthenticated ||
        templates === undefined ||
        submissions === undefined
    ) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Patient Forms
                </h1>
                <p className="text-sm text-muted-foreground">
                    Create forms, generate patient links, and review
                    submissions.
                </p>
            </div>

            <Tabs value={subTab} onValueChange={setSubTab} className="gap-4">
                <TabsList className="rounded-2xl bg-background/80 backdrop-blur">
                    <TabsTrigger value="templates">
                        Forms ({templates.length})
                    </TabsTrigger>
                    <TabsTrigger value="submissions">
                        Submissions ({submissions.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="templates" className="mt-4">
                    <TemplateList
                        clientId={clientId}
                        templates={templates}
                        copyVariant="form"
                        clientName={clientName}
                        portalPrimaryColor={portalPrimaryColor}
                        portalSecondaryColor={portalSecondaryColor}
                    />
                </TabsContent>

                <TabsContent value="submissions" className="mt-4">
                    <SubmissionsList submissions={submissions} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
