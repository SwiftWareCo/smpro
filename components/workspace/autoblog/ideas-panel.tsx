"use client";

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id, Doc } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Lightbulb,
    Sparkles,
    Check,
    X,
    FileText,
    Calendar,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { format, addDays } from "date-fns";

type IdeaStatus =
    | "pending_review"
    | "approved"
    | "rejected"
    | "converted_to_post";

interface IdeasPanelProps {
    clientId: Id<"clients">;
}

const statusConfig: Record<IdeaStatus, { label: string; color: string }> = {
    pending_review: { label: "Pending", color: "bg-yellow-500" },
    approved: { label: "Approved", color: "bg-green-500" },
    rejected: { label: "Rejected", color: "bg-red-500" },
    converted_to_post: { label: "Generated", color: "bg-blue-500" },
};

type LayoutType = "callout" | "story" | "guide";

export function IdeasPanel({ clientId }: IdeasPanelProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [expandedIdeas, setExpandedIdeas] = useState<Set<string>>(new Set());
    const [generatingPostId, setGeneratingPostId] = useState<string | null>(
        null,
    );
    const [topicSeeds, setTopicSeeds] = useState("");

    const ideas = useQuery(api.autoblog.listIdeas, { clientId });
    const seoSettings = useQuery(api.seo.getByClient, { clientId });
    const generateTopics = useAction(api.autoblogTopics.generateTopics);
    const updateIdeaStatus = useMutation(api.autoblog.updateIdeaStatus);
    const generatePost = useAction(api.autoblogPosts.generateFromIdea);

    const hasSeoContext =
        !!seoSettings?.websiteUrl ||
        (!!seoSettings?.industry && seoSettings.industry !== "general") ||
        (!!seoSettings?.targetKeywords &&
            seoSettings.targetKeywords.length > 0);

    const pendingIdeas =
        ideas?.filter((i) => i.status === "pending_review") || [];
    const approvedIdeas = ideas?.filter((i) => i.status === "approved") || [];
    const otherIdeas =
        ideas?.filter(
            (i) => i.status === "rejected" || i.status === "converted_to_post",
        ) || [];

    const parseSeeds = (value: string): string[] | undefined => {
        const seeds = value
            .split(/\n|,/)
            .map((s) => s.trim())
            .filter(Boolean);
        return seeds.length > 0 ? seeds : undefined;
    };

    const handleGenerateTopics = async () => {
        setIsGenerating(true);
        try {
            const seeds = parseSeeds(topicSeeds);
            const result = await generateTopics({
                clientId,
                count: 5,
                topicSeeds: seeds,
            });
            if (result.success) {
                toast.success(
                    `Generated ${result.generatedCount} topic ideas!`,
                );
            } else {
                toast.error(result.error || "Failed to generate topics");
            }
        } catch (error) {
            toast.error("Failed to generate topics");
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleApprove = async (ideaId: Id<"autoblogIdeas">) => {
        try {
            await updateIdeaStatus({ ideaId, status: "approved" });
            toast.success("Idea approved");
        } catch (error) {
            toast.error("Failed to approve idea");
            console.error(error);
        }
    };

    const handleReject = async (ideaId: Id<"autoblogIdeas">) => {
        try {
            await updateIdeaStatus({ ideaId, status: "rejected" });
            toast.success("Idea rejected");
        } catch (error) {
            toast.error("Failed to reject idea");
            console.error(error);
        }
    };

    const handleGeneratePost = async (
        ideaId: Id<"autoblogIdeas">,
        layout: LayoutType,
        scheduledFor?: Date,
    ) => {
        setGeneratingPostId(ideaId);
        try {
            const result = await generatePost({
                ideaId,
                layout,
                scheduledFor: scheduledFor?.getTime(),
            });
            if (result.success) {
                toast.success("Post generated successfully!");
            } else {
                toast.error(result.error || "Failed to generate post");
            }
        } catch (error) {
            toast.error("Failed to generate post");
            console.error(error);
        } finally {
            setGeneratingPostId(null);
        }
    };

    const toggleExpanded = (ideaId: string) => {
        setExpandedIdeas((prev) => {
            const next = new Set(prev);
            if (next.has(ideaId)) {
                next.delete(ideaId);
            } else {
                next.add(ideaId);
            }
            return next;
        });
    };

    if (ideas === undefined) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Spinner className="size-6" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Lightbulb className="size-4" />
                        Topic Ideas
                    </CardTitle>
                    <Button
                        size="sm"
                        onClick={handleGenerateTopics}
                        disabled={isGenerating || !hasSeoContext}
                    >
                        {isGenerating ? (
                            <Spinner className="size-4 mr-2" />
                        ) : (
                            <Sparkles className="size-4 mr-2" />
                        )}
                        Generate
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {!hasSeoContext && seoSettings !== undefined && (
                    <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
                        Configure SEO settings (industry, keywords, or website
                        URL) before generating topics.
                    </div>
                )}

                {/* Topic seeds input */}
                <Textarea
                    rows={2}
                    placeholder="Optional: topic hints (e.g. HVAC tips, energy savings)"
                    value={topicSeeds}
                    onChange={(e) => setTopicSeeds(e.target.value)}
                    className="text-xs"
                    disabled={!hasSeoContext}
                />

                {ideas.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                        <Lightbulb className="size-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No topic ideas yet.</p>
                        <p className="text-xs">
                            Click &quot;Generate&quot; to create some!
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Pending Ideas */}
                        {pendingIdeas.length > 0 && (
                            <IdeaSection
                                title="Pending Review"
                                ideas={pendingIdeas}
                                expandedIdeas={expandedIdeas}
                                onToggleExpanded={toggleExpanded}
                                onApprove={handleApprove}
                                onReject={handleReject}
                                showActions
                            />
                        )}

                        {/* Approved Ideas */}
                        {approvedIdeas.length > 0 && (
                            <IdeaSection
                                title="Ready to Generate"
                                ideas={approvedIdeas}
                                expandedIdeas={expandedIdeas}
                                onToggleExpanded={toggleExpanded}
                                onGeneratePost={handleGeneratePost}
                                generatingPostId={generatingPostId}
                                showGenerateButton
                            />
                        )}

                        {/* Other Ideas */}
                        {otherIdeas.length > 0 && (
                            <Collapsible>
                                <CollapsibleTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-between"
                                    >
                                        <span className="text-xs text-muted-foreground">
                                            {otherIdeas.length} other ideas
                                        </span>
                                        <ChevronDown className="size-3" />
                                    </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <IdeaSection
                                        ideas={otherIdeas}
                                        expandedIdeas={expandedIdeas}
                                        onToggleExpanded={toggleExpanded}
                                    />
                                </CollapsibleContent>
                            </Collapsible>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

interface IdeaSectionProps {
    title?: string;
    ideas: Doc<"autoblogIdeas">[];
    expandedIdeas: Set<string>;
    onToggleExpanded: (id: string) => void;
    onApprove?: (id: Id<"autoblogIdeas">) => void;
    onReject?: (id: Id<"autoblogIdeas">) => void;
    onGeneratePost?: (
        id: Id<"autoblogIdeas">,
        layout: LayoutType,
        scheduledFor?: Date,
    ) => void;
    generatingPostId?: string | null;
    showActions?: boolean;
    showGenerateButton?: boolean;
}

function IdeaSection({
    title,
    ideas,
    expandedIdeas,
    onToggleExpanded,
    onApprove,
    onReject,
    onGeneratePost,
    generatingPostId,
    showActions,
    showGenerateButton,
}: IdeaSectionProps) {
    return (
        <div className="space-y-2">
            {title && (
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {title}
                </h4>
            )}
            {ideas.map((idea) => (
                <IdeaCard
                    key={idea._id}
                    idea={idea}
                    isExpanded={expandedIdeas.has(idea._id)}
                    onToggleExpanded={() => onToggleExpanded(idea._id)}
                    onApprove={onApprove}
                    onReject={onReject}
                    onGeneratePost={onGeneratePost}
                    isGenerating={generatingPostId === idea._id}
                    showActions={showActions}
                    showGenerateButton={showGenerateButton}
                />
            ))}
        </div>
    );
}

interface IdeaCardProps {
    idea: Doc<"autoblogIdeas">;
    isExpanded: boolean;
    onToggleExpanded: () => void;
    onApprove?: (id: Id<"autoblogIdeas">) => void;
    onReject?: (id: Id<"autoblogIdeas">) => void;
    onGeneratePost?: (
        id: Id<"autoblogIdeas">,
        layout: LayoutType,
        scheduledFor?: Date,
    ) => void;
    isGenerating?: boolean;
    showActions?: boolean;
    showGenerateButton?: boolean;
}

function IdeaCard({
    idea,
    isExpanded,
    onToggleExpanded,
    onApprove,
    onReject,
    onGeneratePost,
    isGenerating,
    showActions,
    showGenerateButton,
}: IdeaCardProps) {
    const [scheduleDate, setScheduleDate] = useState<Date | undefined>(
        addDays(new Date(), 7),
    );
    const [selectedLayout, setSelectedLayout] = useState<LayoutType>("callout");

    const config = statusConfig[idea.status as IdeaStatus];

    return (
        <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
                <button onClick={onToggleExpanded} className="flex-1 text-left">
                    <p className="text-sm font-medium line-clamp-2">
                        {idea.title}
                    </p>
                </button>
                <Badge
                    variant="secondary"
                    className={cn("text-white text-xs shrink-0", config.color)}
                >
                    {config.label}
                </Badge>
            </div>

            {isExpanded && (
                <div className="space-y-2 pt-2 border-t">
                    {idea.description && (
                        <p className="text-xs text-muted-foreground">
                            {idea.description}
                        </p>
                    )}
                    {idea.keywords && idea.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {idea.keywords.map((keyword, i) => (
                                <Badge
                                    key={i}
                                    variant="outline"
                                    className="text-xs"
                                >
                                    {keyword}
                                </Badge>
                            ))}
                        </div>
                    )}
                    {idea.targetWordCount && (
                        <p className="text-xs text-muted-foreground">
                            Target: ~{idea.targetWordCount} words
                        </p>
                    )}
                </div>
            )}

            {showActions && (
                <div className="flex gap-2 pt-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => onApprove?.(idea._id)}
                    >
                        <Check className="size-3 mr-1" />
                        Approve
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => onReject?.(idea._id)}
                    >
                        <X className="size-3 mr-1" />
                        Reject
                    </Button>
                </div>
            )}

            {showGenerateButton && (
                <div className="space-y-2 pt-2">
                    <Select
                        value={selectedLayout}
                        onValueChange={(v) =>
                            setSelectedLayout(v as LayoutType)
                        }
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Layout" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="callout">
                                Callouts + Stats
                            </SelectItem>
                            <SelectItem value="story">
                                Story + Quotes
                            </SelectItem>
                            <SelectItem value="guide">
                                Step-by-step Guide
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="flex-1"
                            onClick={() =>
                                onGeneratePost?.(idea._id, selectedLayout)
                            }
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <Spinner className="size-3 mr-1" />
                            ) : (
                                <FileText className="size-3 mr-1" />
                            )}
                            Generate Draft
                        </Button>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={isGenerating}
                                >
                                    <Calendar className="size-3 mr-1" />
                                    Schedule
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <CalendarPicker
                                    mode="single"
                                    selected={scheduleDate}
                                    onSelect={setScheduleDate}
                                    disabled={(date) => date < new Date()}
                                    initialFocus
                                />
                                <div className="p-3 border-t">
                                    <Button
                                        size="sm"
                                        className="w-full"
                                        onClick={() => {
                                            if (scheduleDate) {
                                                onGeneratePost?.(
                                                    idea._id,
                                                    selectedLayout,
                                                    scheduleDate,
                                                );
                                            }
                                        }}
                                        disabled={!scheduleDate || isGenerating}
                                    >
                                        {isGenerating ? (
                                            <Spinner className="size-3 mr-1" />
                                        ) : null}
                                        Generate & Schedule for{" "}
                                        {scheduleDate
                                            ? format(scheduleDate, "MMM d")
                                            : "..."}
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            )}

            <button
                onClick={onToggleExpanded}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
                {isExpanded ? (
                    <>
                        <ChevronUp className="size-3" /> Less
                    </>
                ) : (
                    <>
                        <ChevronDown className="size-3" /> More
                    </>
                )}
            </button>
        </div>
    );
}
