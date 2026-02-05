"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id, Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Spinner } from "@/components/ui/spinner";
import {
    ArrowLeft,
    Save,
    Calendar as CalendarIcon,
    Send,
    Clock,
    Check,
    RefreshCw,
    Eye,
    Code,
} from "lucide-react";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { MDXPreview } from "./mdx-preview";

type PostStatus = "draft" | "scheduled" | "publishing" | "published" | "failed";
type ApprovalStatus = "pending" | "approved" | "rejected";

interface PostEditorProps {
    clientId: Id<"clients">;
    postId: Id<"autoblogPosts">;
    initialPost: Doc<"autoblogPosts">;
    settings: Doc<"autoblogSettings"> | null;
}

const statusColors: Record<PostStatus, string> = {
    draft: "bg-yellow-500",
    scheduled: "bg-blue-500",
    publishing: "bg-purple-500",
    published: "bg-green-500",
    failed: "bg-red-500",
};

const statusLabels: Record<PostStatus, string> = {
    draft: "Draft",
    scheduled: "Scheduled",
    publishing: "Publishing",
    published: "Published",
    failed: "Failed",
};

export function PostEditor({
    clientId,
    postId,
    initialPost,
    settings,
}: PostEditorProps) {
    const router = useRouter();
    const [post, setPost] = useState(initialPost);
    const [title, setTitle] = useState(initialPost.title);
    const [slug, setSlug] = useState(initialPost.slug);
    const [content, setContent] = useState(initialPost.content);
    const [excerpt, setExcerpt] = useState(initialPost.excerpt || "");
    const [tags, setTags] = useState(initialPost.metadata.tags?.join(", ") || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isScheduling, setIsScheduling] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [scheduleDate, setScheduleDate] = useState<Date | undefined>(
        initialPost.scheduledFor
            ? new Date(initialPost.scheduledFor)
            : addDays(new Date(), 7)
    );
    const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

    const updatePost = useMutation(api.autoblog.updatePost);
    const approvePost = useMutation(api.autoblog.approvePost);
    const schedulePost = useMutation(api.autoblogScheduler.schedulePost);
    const publishNow = useMutation(api.autoblogScheduler.publishNow);
    const cancelScheduled = useMutation(api.autoblogScheduler.cancelScheduledPost);
    const regeneratePost = useAction(api.autoblogPosts.regenerate);

    const hasChanges =
        title !== post.title ||
        slug !== post.slug ||
        content !== post.content ||
        excerpt !== (post.excerpt || "") ||
        tags !== (post.metadata.tags?.join(", ") || "");

    const requiresApproval = settings?.config.requiresApproval;
    const needsApproval =
        requiresApproval && post.approvalStatus !== "approved";
    const canPublish = !needsApproval && post.status !== "published";
    const canSchedule = !needsApproval && post.status !== "published";

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        try {
            const tagArray = tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);

            await updatePost({
                postId,
                title,
                slug,
                content,
                excerpt: excerpt || null,
                metadata: {
                    ...post.metadata,
                    tags: tagArray.length > 0 ? tagArray : null,
                },
            });

            setPost((prev) => ({
                ...prev,
                title,
                slug,
                content,
                excerpt: excerpt || null,
                metadata: {
                    ...prev.metadata,
                    tags: tagArray.length > 0 ? tagArray : null,
                },
            }));

            toast.success("Post saved");
        } catch (error) {
            toast.error("Failed to save post");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    }, [postId, title, slug, content, excerpt, tags, post.metadata, updatePost]);

    const handleApprove = async () => {
        try {
            await approvePost({ postId });
            setPost((prev) => ({ ...prev, approvalStatus: "approved" }));
            toast.success("Post approved");
        } catch (error) {
            toast.error("Failed to approve post");
            console.error(error);
        }
    };

    const handleSchedule = async () => {
        if (!scheduleDate) {
            toast.error("Please select a date");
            return;
        }

        if (hasChanges) {
            await handleSave();
        }

        setIsScheduling(true);
        try {
            await schedulePost({
                postId,
                scheduledFor: scheduleDate.getTime(),
            });
            setPost((prev) => ({
                ...prev,
                status: "scheduled",
                scheduledFor: scheduleDate.getTime(),
            }));
            toast.success(`Scheduled for ${format(scheduleDate, "PPP")}`);
        } catch (error) {
            toast.error("Failed to schedule post");
            console.error(error);
        } finally {
            setIsScheduling(false);
        }
    };

    const handlePublishNow = async () => {
        if (hasChanges) {
            await handleSave();
        }

        setIsPublishing(true);
        try {
            await publishNow({ postId });
            setPost((prev) => ({ ...prev, status: "scheduled" }));
            toast.success("Publishing started...");
        } catch (error) {
            toast.error("Failed to publish post");
            console.error(error);
        } finally {
            setIsPublishing(false);
        }
    };

    const handleCancelSchedule = async () => {
        try {
            await cancelScheduled({ postId });
            setPost((prev) => ({
                ...prev,
                status: "draft",
                scheduledFor: null,
            }));
            toast.success("Schedule cancelled");
        } catch (error) {
            toast.error("Failed to cancel schedule");
            console.error(error);
        }
    };

    const handleRegenerate = async () => {
        setIsRegenerating(true);
        try {
            const result = await regeneratePost({ postId });
            if (result.success) {
                toast.success("Post regenerated! Refreshing...");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to regenerate post");
            }
        } catch (error) {
            toast.error("Failed to regenerate post");
            console.error(error);
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleBack = () => {
        router.push(`/workspace/${clientId}?tab=autoblog`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={handleBack}>
                        <ArrowLeft className="size-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">{post.title}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge
                                variant="secondary"
                                className={cn(
                                    "text-white text-xs",
                                    statusColors[post.status as PostStatus]
                                )}
                            >
                                {statusLabels[post.status as PostStatus]}
                            </Badge>
                            {needsApproval && (
                                <Badge variant="outline" className="text-xs">
                                    Needs Approval
                                </Badge>
                            )}
                            {post.scheduledFor && post.status === "scheduled" && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="size-3" />
                                    {format(new Date(post.scheduledFor), "PPP 'at' p")}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRegenerate}
                        disabled={isRegenerating || post.status === "publishing"}
                    >
                        {isRegenerating ? (
                            <Spinner className="size-4 mr-2" />
                        ) : (
                            <RefreshCw className="size-4 mr-2" />
                        )}
                        Regenerate
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                    >
                        {isSaving ? (
                            <Spinner className="size-4 mr-2" />
                        ) : (
                            <Save className="size-4 mr-2" />
                        )}
                        Save
                    </Button>
                </div>
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Editor / Preview */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader className="pb-3">
                            <Tabs
                                value={activeTab}
                                onValueChange={(v) => setActiveTab(v as "edit" | "preview")}
                            >
                                <TabsList>
                                    <TabsTrigger value="edit" className="flex items-center gap-2">
                                        <Code className="size-4" />
                                        Edit
                                    </TabsTrigger>
                                    <TabsTrigger value="preview" className="flex items-center gap-2">
                                        <Eye className="size-4" />
                                        Preview
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </CardHeader>
                        <CardContent>
                            {activeTab === "edit" ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Title</Label>
                                            <Input
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="Post title"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Slug</Label>
                                            <Input
                                                value={slug}
                                                onChange={(e) => setSlug(e.target.value)}
                                                placeholder="post-slug"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Excerpt</Label>
                                        <Textarea
                                            value={excerpt}
                                            onChange={(e) => setExcerpt(e.target.value)}
                                            placeholder="Brief description of the post"
                                            rows={2}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Tags (comma separated)</Label>
                                        <Input
                                            value={tags}
                                            onChange={(e) => setTags(e.target.value)}
                                            placeholder="tag1, tag2, tag3"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Content (MDX)</Label>
                                        <Textarea
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            placeholder="Write your post content in MDX..."
                                            rows={20}
                                            className="font-mono text-sm"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <MDXPreview content={content} />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Approval Card */}
                    {needsApproval && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Approval Required</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    This post requires approval before it can be scheduled or
                                    published.
                                </p>
                                <Button onClick={handleApprove} className="w-full">
                                    <Check className="size-4 mr-2" />
                                    Approve Post
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Schedule Card */}
                    {canSchedule && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Schedule</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {post.status === "scheduled" ? (
                                    <>
                                        <p className="text-sm">
                                            Scheduled for{" "}
                                            <strong>
                                                {format(new Date(post.scheduledFor!), "PPP 'at' p")}
                                            </strong>
                                        </p>
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={handleCancelSchedule}
                                        >
                                            Cancel Schedule
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start text-left font-normal"
                                                >
                                                    <CalendarIcon className="size-4 mr-2" />
                                                    {scheduleDate
                                                        ? format(scheduleDate, "PPP")
                                                        : "Pick a date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={scheduleDate}
                                                    onSelect={setScheduleDate}
                                                    disabled={(date) => date < new Date()}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <Button
                                            className="w-full"
                                            onClick={handleSchedule}
                                            disabled={!scheduleDate || isScheduling}
                                        >
                                            {isScheduling ? (
                                                <Spinner className="size-4 mr-2" />
                                            ) : (
                                                <CalendarIcon className="size-4 mr-2" />
                                            )}
                                            Schedule Post
                                        </Button>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Publish Card */}
                    {canPublish && post.status !== "scheduled" && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Publish</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Publish this post to GitHub immediately.
                                </p>
                                <Button
                                    className="w-full"
                                    onClick={handlePublishNow}
                                    disabled={isPublishing}
                                >
                                    {isPublishing ? (
                                        <Spinner className="size-4 mr-2" />
                                    ) : (
                                        <Send className="size-4 mr-2" />
                                    )}
                                    Publish Now
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Metadata Card */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Metadata</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            {post.metadata.featuredImage && (
                                <div>
                                    <Label className="text-muted-foreground">Featured Image</Label>
                                    <img
                                        src={post.metadata.featuredImage}
                                        alt="Featured"
                                        className="mt-1 rounded-md w-full aspect-video object-cover"
                                    />
                                </div>
                            )}
                            {post.metadata.author && (
                                <div>
                                    <Label className="text-muted-foreground">Author</Label>
                                    <p>{post.metadata.author}</p>
                                </div>
                            )}
                            {post.metadata.readingTime && (
                                <div>
                                    <Label className="text-muted-foreground">Reading Time</Label>
                                    <p>{post.metadata.readingTime} min read</p>
                                </div>
                            )}
                            {post.generation && (
                                <div>
                                    <Label className="text-muted-foreground">Generated</Label>
                                    <p>
                                        {post.generation.model} -{" "}
                                        {format(new Date(post.generation.generatedAt), "PPP")}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
