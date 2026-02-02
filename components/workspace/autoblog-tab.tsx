"use client";

import { useEffect, useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";

type PostStatus = "draft" | "scheduled" | "publishing" | "published" | "failed";

type AutoblogPost = Doc<"autoblogPosts">;

const postingCadenceOptions = ["weekly", "biweekly", "monthly"] as const;
type PostingCadence = (typeof postingCadenceOptions)[number];

const layoutOptions = ["callout", "story", "guide"] as const;
type Layout = (typeof layoutOptions)[number];

interface AutoblogTabProps {
    clientId: Id<"clients">;
}

const statusVariants: Record<
    PostStatus,
    "default" | "secondary" | "outline" | "destructive"
> = {
    draft: "outline",
    scheduled: "secondary",
    publishing: "secondary",
    published: "default",
    failed: "destructive",
};

const formatDate = (timestamp?: number | null) => {
    if (!timestamp) return "-";
    return format(new Date(timestamp), "MMM d, yyyy");
};

const parseTopicSeeds = (value: string) => {
    const seeds = value
        .split(/\n|,/)
        .map((seed) => seed.trim())
        .filter(Boolean);
    return seeds.length ? seeds : null;
};

const isPostingCadence = (value: string): value is PostingCadence =>
    postingCadenceOptions.includes(value as PostingCadence);

const isLayout = (value: string): value is Layout =>
    layoutOptions.includes(value as Layout);

export function AutoblogTab({ clientId }: AutoblogTabProps) {
    const settings = useQuery(api.autoblog.getSettings, { clientId });
    const posts = useQuery(api.autoblog.listPosts, { clientId });
    const upsertSettings = useMutation(api.autoblog.upsertSettings);

    const [repoOwner, setRepoOwner] = useState("");
    const [repoName, setRepoName] = useState("");
    const [contentPath, setContentPath] = useState("content/blog");
    const [defaultBranch, setDefaultBranch] = useState("main");
    const [postingCadence, setPostingCadence] =
        useState<PostingCadence>("weekly");
    const [postsPerMonth, setPostsPerMonth] = useState("4");
    const [topicSeeds, setTopicSeeds] = useState("");
    const [layout, setLayout] = useState<Layout>("callout");
    const [requiresApproval, setRequiresApproval] = useState(true);
    const [autoPublish, setAutoPublish] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(
        new Date(),
    );
    const [activePost, setActivePost] = useState<AutoblogPost | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [hasLoadedSettings, setHasLoadedSettings] = useState(false);
    const [savingConnection, setSavingConnection] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);

    useEffect(() => {
        if (settings === undefined || isDirty) return;

        const config = settings?.config;

        setRepoOwner(settings?.repoOwner ?? "");
        setRepoName(settings?.repoName ?? "");
        setContentPath(settings?.contentPath ?? "content/blog");
        setDefaultBranch(settings?.defaultBranch ?? "main");
        setPostingCadence(config?.postingCadence ?? "weekly");
        setPostsPerMonth(String(config?.postsPerMonth ?? 4));
        setTopicSeeds((config?.topicSeeds ?? []).join("\n"));
        setLayout(config?.layout ?? "callout");
        setRequiresApproval(config?.requiresApproval ?? true);
        setAutoPublish(config?.autoPublish ?? false);
        setHasLoadedSettings(true);
    }, [settings, isDirty]);

    const settingsActive = Boolean(settings?.isActive);
    const isConnected = Boolean(
        settings?.githubInstallationId ||
        (settings?.repoOwner && settings?.repoName),
    );
    const canViewSchedule = isConnected && settingsActive;
    const hasPosts = (posts?.length ?? 0) > 0;
    const isLoading = settings === undefined || posts === undefined;

    const sortedPosts = useMemo(() => {
        if (!posts) return [];
        return [...posts].sort((a, b) => {
            const aTime = a.scheduledFor ?? a.publishedAt ?? a.updatedAt ?? 0;
            const bTime = b.scheduledFor ?? b.publishedAt ?? b.updatedAt ?? 0;
            return bTime - aTime;
        });
    }, [posts]);

    const scheduledPosts = useMemo(
        () => sortedPosts.filter((post) => post.scheduledFor),
        [sortedPosts],
    );

    const scheduledDays = useMemo(() => {
        const seen = new Set<string>();
        const dates: Date[] = [];
        scheduledPosts.forEach((post) => {
            if (!post.scheduledFor) return;
            const date = new Date(post.scheduledFor);
            const key = format(date, "yyyy-MM-dd");
            if (!seen.has(key)) {
                seen.add(key);
                dates.push(date);
            }
        });
        return dates;
    }, [scheduledPosts]);

    const selectedDayPosts = useMemo(() => {
        if (!selectedDate) return [];
        return scheduledPosts.filter((post) =>
            post.scheduledFor
                ? isSameDay(new Date(post.scheduledFor), selectedDate)
                : false,
        );
    }, [scheduledPosts, selectedDate]);

    const markDirty = () => {
        if (!isDirty) setIsDirty(true);
    };

    const openPost = (post: AutoblogPost) => {
        setActivePost(post);
        setIsDialogOpen(true);
    };

    const handleSaveConnection = async () => {
        if (!repoOwner.trim() || !repoName.trim()) {
            toast.error("Enter both repo owner and repo name");
            return;
        }

        setSavingConnection(true);
        try {
            await upsertSettings({
                clientId,
                repoOwner: repoOwner.trim(),
                repoName: repoName.trim(),
                contentPath: contentPath.trim() || null,
                defaultBranch: defaultBranch.trim() || null,
                isActive: settings?.isActive ?? false,
                config: {
                    postingCadence,
                    postsPerMonth: Math.max(
                        1,
                        Number.parseInt(postsPerMonth, 10) || 1,
                    ),
                    topicSeeds: parseTopicSeeds(topicSeeds),
                    layout,
                    requiresApproval,
                    autoPublish,
                },
            });
            toast.success("GitHub connection saved");
            setIsDirty(false);
        } catch (error) {
            console.error("Save connection error:", error);
            toast.error("Failed to save GitHub connection");
        } finally {
            setSavingConnection(false);
        }
    };

    const handleSaveSettings = async () => {
        if (!isConnected) {
            toast.error("Connect GitHub before saving settings");
            return;
        }

        setSavingSettings(true);
        try {
            await upsertSettings({
                clientId,
                repoOwner: repoOwner.trim() || null,
                repoName: repoName.trim() || null,
                contentPath: contentPath.trim() || null,
                defaultBranch: defaultBranch.trim() || null,
                isActive: true,
                config: {
                    postingCadence,
                    postsPerMonth: Math.max(
                        1,
                        Number.parseInt(postsPerMonth, 10) || 1,
                    ),
                    topicSeeds: parseTopicSeeds(topicSeeds),
                    layout,
                    requiresApproval,
                    autoPublish,
                },
            });
            toast.success("Auto-Blog settings saved");
            setIsDirty(false);
        } catch (error) {
            console.error("Save settings error:", error);
            toast.error("Failed to save Auto-Blog settings");
        } finally {
            setSavingSettings(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold">Auto-Blog</h2>
                        <Badge variant="secondary" className="text-xs">
                            UI Preview
                        </Badge>
                        {settingsActive && (
                            <Badge variant="outline" className="text-xs">
                                Settings saved
                            </Badge>
                        )}
                        {isLoading && (
                            <span className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Spinner className="size-3" />
                                Loading
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        AI-powered blog automation that publishes SEO-optimized
                        MDX to your client&apos;s GitHub repo on a schedule.
                    </p>
                </div>
                <Button
                    variant="outline"
                    disabled={!isConnected}
                    onClick={() => {
                        if (!hasPosts) {
                            toast("No posts available yet");
                            return;
                        }
                        openPost(sortedPosts[0]);
                    }}
                >
                    Generate Sample Post
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>GitHub Connection</CardTitle>
                            <Badge
                                variant={isConnected ? "secondary" : "outline"}
                            >
                                {isConnected ? "Connected" : "Not connected"}
                            </Badge>
                        </div>
                        <CardDescription>
                            Link the client repo and content folder.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            className="w-full"
                            variant={isConnected ? "secondary" : "outline"}
                            onClick={handleSaveConnection}
                            disabled={savingConnection || isLoading}
                        >
                            {savingConnection
                                ? "Saving..."
                                : isConnected
                                  ? "Update Connection"
                                  : "Connect GitHub"}
                        </Button>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label>Repo Owner</Label>
                                <Input
                                    value={repoOwner}
                                    onChange={(event) => {
                                        setRepoOwner(event.target.value);
                                        markDirty();
                                    }}
                                    placeholder="acme-agency"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Repo Name</Label>
                                <Input
                                    value={repoName}
                                    onChange={(event) => {
                                        setRepoName(event.target.value);
                                        markDirty();
                                    }}
                                    placeholder="client-site"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Content Path</Label>
                                <Input
                                    value={contentPath}
                                    onChange={(event) => {
                                        setContentPath(event.target.value);
                                        markDirty();
                                    }}
                                    placeholder="content/blog"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Default Branch</Label>
                                <Select
                                    value={defaultBranch}
                                    onValueChange={(value) => {
                                        setDefaultBranch(value);
                                        markDirty();
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="main">
                                            main
                                        </SelectItem>
                                        <SelectItem value="content">
                                            content
                                        </SelectItem>
                                        <SelectItem value="staging">
                                            staging
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {isConnected ? (
                    <>
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <CardTitle>Content Plan</CardTitle>
                                        <CardDescription>
                                            Set cadence, topics, and output
                                            style.
                                        </CardDescription>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={handleSaveSettings}
                                        disabled={savingSettings || isLoading}
                                    >
                                        {savingSettings
                                            ? "Saving..."
                                            : "Save Settings"}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Posting Cadence</Label>
                                    <Select
                                        value={postingCadence}
                                        onValueChange={(value) => {
                                            if (isPostingCadence(value)) {
                                                setPostingCadence(value);
                                                markDirty();
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select cadence" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="weekly">
                                                Weekly
                                            </SelectItem>
                                            <SelectItem value="biweekly">
                                                Every 2 weeks
                                            </SelectItem>
                                            <SelectItem value="monthly">
                                                Monthly
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Posts Per Month</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={postsPerMonth}
                                        onChange={(event) => {
                                            setPostsPerMonth(
                                                event.target.value,
                                            );
                                            markDirty();
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Topic Seeds</Label>
                                    <Textarea
                                        rows={4}
                                        placeholder="Ex: HVAC maintenance tips, seasonal tune-ups, energy savings"
                                        value={topicSeeds}
                                        onChange={(event) => {
                                            setTopicSeeds(event.target.value);
                                            markDirty();
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>MDX Layout</Label>
                                    <Select
                                        value={layout}
                                        onValueChange={(value) => {
                                            if (isLayout(value)) {
                                                setLayout(value);
                                                markDirty();
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select layout" />
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
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Approval & Publishing</CardTitle>
                                <CardDescription>
                                    Control review flow and publishing rules.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label>Require Approval</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Review drafts before they go live.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={requiresApproval}
                                        onCheckedChange={(checked) => {
                                            setRequiresApproval(checked);
                                            markDirty();
                                        }}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label>Auto-Publish</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Commit MDX on schedule.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={autoPublish}
                                        onCheckedChange={(checked) => {
                                            setAutoPublish(checked);
                                            markDirty();
                                        }}
                                    />
                                </div>
                                <div className="rounded-lg border p-3 text-xs text-muted-foreground">
                                    Publishing triggers a Vercel build and
                                    deploy for the connected repo.
                                </div>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Connect GitHub to Continue</CardTitle>
                            <CardDescription>
                                Content planning, approvals, and publishing
                                settings unlock after a repo is connected.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                Connect a GitHub repo to enable Auto-Blog
                                settings and scheduling.
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Workflow Preview</CardTitle>
                        <CardDescription>
                            Auto-Blog pipeline from idea to deploy.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-lg border p-3">
                                <p className="text-sm font-medium">Connect</p>
                                <p className="text-xs text-muted-foreground">
                                    Link GitHub repo and content folder.
                                </p>
                            </div>
                            <div className="rounded-lg border p-3">
                                <p className="text-sm font-medium">Generate</p>
                                <p className="text-xs text-muted-foreground">
                                    AI drafts MDX with layouts and images.
                                </p>
                            </div>
                            <div className="rounded-lg border p-3">
                                <p className="text-sm font-medium">Approve</p>
                                <p className="text-xs text-muted-foreground">
                                    Optional review inside the dashboard.
                                </p>
                            </div>
                            <div className="rounded-lg border p-3">
                                <p className="text-sm font-medium">Publish</p>
                                <p className="text-xs text-muted-foreground">
                                    Convex commits and Vercel deploys.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {isConnected && !settingsActive && hasLoadedSettings && (
                <Card>
                    <CardHeader>
                        <CardTitle>Schedule & Posts</CardTitle>
                        <CardDescription>
                            Save Auto-Blog settings to unlock the schedule view
                            and post list.
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}

            {canViewSchedule && (
                <Card>
                    <CardHeader>
                        <CardTitle>Schedule & Posts</CardTitle>
                        <CardDescription>
                            Track upcoming drafts, scheduled publishes, and
                            history.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="table" className="w-full">
                            <TabsList>
                                <TabsTrigger value="table">Table</TabsTrigger>
                                <TabsTrigger value="calendar">
                                    Calendar
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="table" className="mt-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Scheduled</TableHead>
                                            <TableHead>Updated</TableHead>
                                            <TableHead className="text-right">
                                                Action
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedPosts.length > 0 ? (
                                            sortedPosts.map((post) => (
                                                <TableRow key={post._id}>
                                                    <TableCell className="font-medium">
                                                        {post.title}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                statusVariants[
                                                                    post.status as PostStatus
                                                                ]
                                                            }
                                                        >
                                                            {post.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatDate(
                                                            post.scheduledFor,
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatDate(
                                                            post.updatedAt,
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                openPost(post)
                                                            }
                                                        >
                                                            View
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={5}
                                                    className="text-center text-sm text-muted-foreground"
                                                >
                                                    No posts yet. Drafts will
                                                    appear here after
                                                    generation.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TabsContent>
                            <TabsContent value="calendar" className="mt-4">
                                <div className="grid gap-6 lg:grid-cols-[auto,1fr]">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={setSelectedDate}
                                        modifiers={{ scheduled: scheduledDays }}
                                        modifiersClassNames={{
                                            scheduled:
                                                "bg-primary/10 text-primary rounded-md",
                                        }}
                                    />
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">
                                                Scheduled for{" "}
                                                {selectedDate
                                                    ? format(
                                                          selectedDate,
                                                          "MMM d, yyyy",
                                                      )
                                                    : "Select a day"}
                                            </p>
                                            <Badge variant="outline">
                                                {selectedDayPosts.length} posts
                                            </Badge>
                                        </div>
                                        {selectedDayPosts.length > 0 ? (
                                            <div className="space-y-2">
                                                {selectedDayPosts.map(
                                                    (post) => (
                                                        <button
                                                            key={post._id}
                                                            type="button"
                                                            onClick={() =>
                                                                openPost(post)
                                                            }
                                                            className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition hover:bg-muted/50"
                                                        >
                                                            <div>
                                                                <p className="text-sm font-medium">
                                                                    {post.title}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {post.slug}
                                                                </p>
                                                            </div>
                                                            <Badge
                                                                variant={
                                                                    statusVariants[
                                                                        post.status as PostStatus
                                                                    ]
                                                                }
                                                            >
                                                                {post.status}
                                                            </Badge>
                                                        </button>
                                                    ),
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                No posts scheduled for this day.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {activePost?.title ?? "Post preview"}
                        </DialogTitle>
                        <DialogDescription>
                            Review the draft details before publishing.
                        </DialogDescription>
                    </DialogHeader>
                    {activePost && (
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                    variant={
                                        statusVariants[
                                            activePost.status as PostStatus
                                        ]
                                    }
                                >
                                    {activePost.status}
                                </Badge>
                                {activePost.scheduledFor && (
                                    <Badge variant="outline">
                                        Scheduled{" "}
                                        {formatDate(activePost.scheduledFor)}
                                    </Badge>
                                )}
                                {activePost.publishedAt && (
                                    <Badge variant="outline">
                                        Published{" "}
                                        {formatDate(activePost.publishedAt)}
                                    </Badge>
                                )}
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">
                                        Slug
                                    </p>
                                    <p className="text-sm font-medium">
                                        {activePost.slug}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">
                                        Last updated
                                    </p>
                                    <p className="text-sm font-medium">
                                        {formatDate(activePost.updatedAt)}
                                    </p>
                                </div>
                            </div>
                            {activePost.excerpt && (
                                <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                                    {activePost.excerpt}
                                </div>
                            )}
                            <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap">
                                {activePost.content}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
