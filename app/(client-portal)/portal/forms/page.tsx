"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePortalClient } from "@/components/portal/portal-client-provider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TemplateList } from "@/components/dental-forms/template-list";
import { SubmissionsList } from "@/components/dental-forms/submissions-list";
import { Loader2 } from "lucide-react";

export default function PortalFormsPage() {
    const { clientId } = usePortalClient();
    const [subTab, setSubTab] = useState("templates");

    const templates = useQuery(api.formTemplates.list, { clientId });
    const submissions = useQuery(api.formSubmissions.list, { clientId });

    if (templates === undefined || submissions === undefined) {
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
                    Create form templates, generate patient links, and review
                    submissions.
                </p>
            </div>

            <Tabs value={subTab} onValueChange={setSubTab}>
                <TabsList>
                    <TabsTrigger value="templates">
                        Templates ({templates.length})
                    </TabsTrigger>
                    <TabsTrigger value="submissions">
                        Submissions ({submissions.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="templates" className="mt-4">
                    <TemplateList
                        clientId={clientId}
                        templates={templates}
                    />
                </TabsContent>

                <TabsContent value="submissions" className="mt-4">
                    <SubmissionsList
                        clientId={clientId}
                        submissions={submissions}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
