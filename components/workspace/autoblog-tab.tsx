"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { X, Check, ChevronRight } from "lucide-react";

interface GitHubRepo {
    id: number;
    fullName: string;
    name: string;
    owner: string;
    defaultBranch: string;
    private: boolean;
}

const postingCadenceOptions = ["weekly", "biweekly", "monthly"] as const;
type PostingCadence = (typeof postingCadenceOptions)[number];

const layoutOptions = ["callout", "story", "guide"] as const;
type Layout = (typeof layoutOptions)[number];

interface AutoblogTabProps {
    clientId: Id<"clients">;
}

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

type WizardStep = "connect" | "repository" | "settings";

export function AutoblogTab({ clientId }: AutoblogTabProps) {
    const settings = useQuery(api.autoblog.getSettings, { clientId });
    const upsertSettings = useMutation(api.autoblog.upsertSettings);
    const saveGithubInstallation = useMutation(
        api.autoblog.saveGithubInstallation,
    );
    const listInstallationRepos = useAction(api.github.listInstallationRepos);
    const searchParams = useSearchParams();

    const [availableRepos, setAvailableRepos] = useState<GitHubRepo[] | null>(
        null,
    );
    const [loadingRepos, setLoadingRepos] = useState(false);
    const [selectedRepoFullName, setSelectedRepoFullName] =
        useState<string>("");

    // Form states
    const [contentPath, setContentPath] = useState("content/blog");
    const [postingCadence, setPostingCadence] =
        useState<PostingCadence>("weekly");
    const [postsPerMonth, setPostsPerMonth] = useState("4");
    const [topicSeeds, setTopicSeeds] = useState("");
    const [layout, setLayout] = useState<Layout>("callout");
    const [requiresApproval, setRequiresApproval] = useState(true);
    const [autoPublish, setAutoPublish] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);

    // Track if we've already processed the installation callback
    const hasProcessedInstallation = useRef(false);

    // Load settings from DB
    useEffect(() => {
        if (settings === undefined) return;

        const config = settings?.config;

        setContentPath(settings?.contentPath ?? "content/blog");
        setPostingCadence(config?.postingCadence ?? "weekly");
        setPostsPerMonth(String(config?.postsPerMonth ?? 4));
        setTopicSeeds((config?.topicSeeds ?? []).join("\n"));
        setLayout(config?.layout ?? "callout");
        setRequiresApproval(config?.requiresApproval ?? true);
        setAutoPublish(config?.autoPublish ?? false);
    }, [settings]);

    // Detect GitHub App installation callback and save installation ID
    useEffect(() => {
        const installationIdParam = searchParams.get("installation_id");

        if (!installationIdParam || hasProcessedInstallation.current) return;

        const parsedId = Number(installationIdParam);
        if (!Number.isFinite(parsedId)) {
            toast.error("Invalid installation ID");
            return;
        }

        hasProcessedInstallation.current = true;

        // Clean the URL immediately
        const url = new URL(window.location.href);
        url.searchParams.delete("installation_id");
        url.searchParams.delete("setup_action");
        url.searchParams.delete("state");
        window.history.replaceState({}, "", url.toString());

        // Save installation
        toast.promise(
            saveGithubInstallation({
                clientId,
                installationId: parsedId,
            }),
            {
                loading: "Connecting GitHub...",
                success: "GitHub App connected!",
                error: "Failed to connect GitHub.",
            },
        );
    }, [searchParams, clientId, saveGithubInstallation]);

    // Determine current step
    const isGithubAppConnected = Boolean(settings?.githubInstallationId);
    const hasRepoConfig = Boolean(settings?.repoOwner && settings?.repoName);
    const isFullyConfigured = hasRepoConfig && Boolean(settings?.isActive);

    const getCurrentStep = (): WizardStep => {
        if (!isGithubAppConnected) return "connect";
        if (!hasRepoConfig) return "repository";
        return "settings";
    };

    const currentStep = getCurrentStep();
    const isLoading = settings === undefined;

    // Auto-fetch repos when on repository step
    const hasFetchedRepos = useRef(false);
    useEffect(() => {
        if (
            currentStep === "repository" &&
            settings?.githubInstallationId &&
            !availableRepos &&
            !loadingRepos &&
            !hasFetchedRepos.current
        ) {
            hasFetchedRepos.current = true;
            setLoadingRepos(true);
            listInstallationRepos({
                clientId,
                installationId: settings.githubInstallationId,
            })
                .then((repos) => {
                    setAvailableRepos(repos);
                    if (repos.length === 1) {
                        setSelectedRepoFullName(repos[0].fullName);
                    }
                })
                .catch((err) => {
                    toast.error("Failed to load repositories");
                    console.error(err);
                    hasFetchedRepos.current = false; // Allow retry
                })
                .finally(() => setLoadingRepos(false));
        }
    }, [
        currentStep,
        settings?.githubInstallationId,
        availableRepos,
        loadingRepos,
        clientId,
        listInstallationRepos,
    ]);

    const handleRepoSelect = (fullName: string) => {
        setSelectedRepoFullName(fullName);
    };

    const handleSaveRepository = async () => {
        if (!settings?.githubInstallationId || !selectedRepoFullName) {
            toast.error("Please select a repository");
            return;
        }

        const repo = availableRepos?.find(
            (r) => r.fullName === selectedRepoFullName,
        );
        if (!repo) {
            toast.error("Repository not found");
            return;
        }

        setSavingSettings(true);
        try {
            await upsertSettings({
                clientId,
                githubInstallationId: settings.githubInstallationId,
                repoOwner: repo.owner,
                repoName: repo.name,
                contentPath: contentPath.trim() || "content/blog",
                defaultBranch: repo.defaultBranch,
                isActive: false,
            });
            toast.success("Repository connected!");
            setAvailableRepos(null);
            setSelectedRepoFullName("");
        } catch (error) {
            console.error("Save repository error:", error);
            toast.error("Failed to save repository");
        } finally {
            setSavingSettings(false);
        }
    };

    const handleSaveSettings = async () => {
        setSavingSettings(true);
        try {
            await upsertSettings({
                clientId,
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
            toast.success("Settings saved!");
        } catch (error) {
            console.error("Save settings error:", error);
            toast.error("Failed to save settings");
        } finally {
            setSavingSettings(false);
        }
    };

    const startGitHubInstall = () => {
        const state = btoa(JSON.stringify({ clientId }));
        const appSlug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG;
        window.location.href = `https://github.com/apps/${appSlug}/installations/new?state=${state}`;
    };

    const handleClose = () => {
        // Could navigate away or collapse the wizard
        toast("Setup cancelled");
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Spinner className="size-6" />
            </div>
        );
    }

    // If fully configured, show summary view
    if (isFullyConfigured) {
        return (
            <div className="space-y-6">
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold">Auto-Blog</h2>
                    <p className="text-sm text-muted-foreground">
                        AI-powered blog automation for {settings?.repoOwner}/
                        {settings?.repoName}
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Configuration</CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={startGitHubInstall}
                            >
                                Change Repository
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">
                                    Repository
                                </Label>
                                <p className="text-sm font-medium">
                                    {settings?.repoOwner}/{settings?.repoName}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">
                                    Content Path
                                </Label>
                                <p className="text-sm font-medium">
                                    {settings?.contentPath}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">
                                    Posting Cadence
                                </Label>
                                <p className="text-sm font-medium capitalize">
                                    {settings?.config.postingCadence}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">
                                    Posts Per Month
                                </Label>
                                <p className="text-sm font-medium">
                                    {settings?.config.postsPerMonth}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                {settings?.config.requiresApproval ? (
                                    <Check className="size-4 text-green-600" />
                                ) : (
                                    <X className="size-4 text-muted-foreground" />
                                )}
                                <span className="text-sm">
                                    Require Approval
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {settings?.config.autoPublish ? (
                                    <Check className="size-4 text-green-600" />
                                ) : (
                                    <X className="size-4 text-muted-foreground" />
                                )}
                                <span className="text-sm">Auto-Publish</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Wizard view
    const steps: { id: WizardStep; label: string }[] = [
        { id: "connect", label: "Connect GitHub" },
        { id: "repository", label: "Select Repository" },
        { id: "settings", label: "Configure" },
    ];

    const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold">Auto-Blog Setup</h2>
                    <p className="text-sm text-muted-foreground">
                        Connect your GitHub repository to enable automated blog
                        publishing.
                    </p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleClose}>
                    <X className="size-4" />
                </Button>
            </div>

            {/* Step indicators */}
            <div className="flex items-center gap-2">
                {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                        <div
                            className={cn(
                                "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                                index < currentStepIndex &&
                                    "bg-green-100 text-green-700",
                                index === currentStepIndex &&
                                    "bg-primary text-primary-foreground",
                                index > currentStepIndex &&
                                    "bg-muted text-muted-foreground",
                            )}
                        >
                            {index < currentStepIndex ? (
                                <Check className="size-4" />
                            ) : (
                                <span className="flex size-5 items-center justify-center rounded-full border text-xs">
                                    {index + 1}
                                </span>
                            )}
                            <span className="hidden sm:inline">
                                {step.label}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <ChevronRight className="mx-2 size-4 text-muted-foreground" />
                        )}
                    </div>
                ))}
            </div>

            {/* Step content */}
            <Card>
                <CardContent className="pt-6">
                    {/* Step 1: Connect GitHub */}
                    {currentStep === "connect" && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <h3 className="font-semibold">
                                    Install GitHub App
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Install our GitHub App to grant access to
                                    your repositories. You&apos;ll be redirected
                                    to GitHub to complete the installation.
                                </p>
                            </div>
                            <Button onClick={startGitHubInstall}>
                                Install GitHub App
                            </Button>
                        </div>
                    )}

                    {/* Step 2: Select Repository */}
                    {currentStep === "repository" && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <h3 className="font-semibold">
                                    Select Repository
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Choose which repository to publish blog
                                    posts to.
                                </p>
                            </div>

                            {loadingRepos && (
                                <div className="flex items-center gap-2 py-4">
                                    <Spinner className="size-4" />
                                    <span className="text-sm text-muted-foreground">
                                        Loading repositories...
                                    </span>
                                </div>
                            )}

                            {availableRepos && !loadingRepos && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Repository</Label>
                                        <Select
                                            value={selectedRepoFullName}
                                            onValueChange={handleRepoSelect}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose a repository" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableRepos.map((repo) => (
                                                    <SelectItem
                                                        key={repo.id}
                                                        value={repo.fullName}
                                                    >
                                                        {repo.fullName}
                                                        {repo.private &&
                                                            " (private)"}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Content Path</Label>
                                        <Input
                                            value={contentPath}
                                            onChange={(e) =>
                                                setContentPath(e.target.value)
                                            }
                                            placeholder="content/blog"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Path where blog posts will be saved
                                            in your repository.
                                        </p>
                                    </div>

                                    <Button
                                        onClick={handleSaveRepository}
                                        disabled={
                                            !selectedRepoFullName ||
                                            savingSettings
                                        }
                                    >
                                        {savingSettings
                                            ? "Saving..."
                                            : "Continue"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Configure Settings */}
                    {currentStep === "settings" && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h3 className="font-semibold">
                                    Configure Auto-Blog
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Set your publishing preferences for{" "}
                                    {settings?.repoOwner}/{settings?.repoName}.
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Posting Cadence</Label>
                                    <Select
                                        value={postingCadence}
                                        onValueChange={(value) => {
                                            if (isPostingCadence(value)) {
                                                setPostingCadence(value);
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
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
                                        onChange={(e) =>
                                            setPostsPerMonth(e.target.value)
                                        }
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Topic Seeds</Label>
                                <Textarea
                                    rows={3}
                                    placeholder="Ex: HVAC maintenance tips, seasonal tune-ups, energy savings"
                                    value={topicSeeds}
                                    onChange={(e) =>
                                        setTopicSeeds(e.target.value)
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    Topics to guide AI-generated content.
                                    Separate with commas or new lines.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>MDX Layout</Label>
                                <Select
                                    value={layout}
                                    onValueChange={(value) => {
                                        if (isLayout(value)) {
                                            setLayout(value);
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
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

                            <div className="space-y-4 rounded-lg border p-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Require Approval</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Review drafts before publishing.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={requiresApproval}
                                        onCheckedChange={setRequiresApproval}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Auto-Publish</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Automatically commit posts on
                                            schedule.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={autoPublish}
                                        onCheckedChange={setAutoPublish}
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={handleSaveSettings}
                                disabled={savingSettings}
                            >
                                {savingSettings
                                    ? "Saving..."
                                    : "Complete Setup"}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
