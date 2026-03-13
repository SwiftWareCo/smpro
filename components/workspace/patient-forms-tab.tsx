"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TemplateList } from "@/components/dental-forms/template-list";
import { SubmissionsList } from "@/components/dental-forms/submissions-list";
import { Loader2 } from "lucide-react";

interface PatientFormsTabProps {
    clientId: Id<"clients">;
}

export function PatientFormsTab({ clientId }: PatientFormsTabProps) {
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
        <div className="space-y-4">
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
                        readOnly
                    />
                </TabsContent>

                <TabsContent value="submissions" className="mt-4">
                    <SubmissionsList submissions={submissions} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
