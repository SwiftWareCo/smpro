"use client";

import { useMemo } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthenticatedQuery } from "@/hooks/use-authenticated-query";
import { api } from "@/convex/_generated/api";
import { getCurrentPeriodKey } from "@/lib/usage-utils";

/** Maps service keys to a provider group for aggregation */
const SERVICE_TO_PROVIDER: Record<string, string> = {
    blog_generation: "gemini-2.5-flash",
    seo_analysis: "gemini-2.5-flash",
    topic_generation: "gemini-2.5-flash",
    trending_topics: "gemini-2.5-flash",
    kb_chat: "gemini-3.1-flash-lite",
    form_translation: "gemini-3.1-flash-lite",
    kb_embedding: "gemini-embedding-2",
    email_delivery: "resend",
    web_scraping: "jina",
};

const MODEL_LIMITS = [
    {
        key: "gemini-2.5-flash",
        model: "Gemini 2.5 Flash",
        category: "Text-out models",
        rpmLimit: 1000,
        tpmLimit: 1_000_000,
        rpdLimit: 10_000,
    },
    {
        key: "gemini-3.1-flash-lite",
        model: "Gemini 3.1 Flash Lite",
        category: "Text-out models",
        rpmLimit: 4000,
        tpmLimit: 4_000_000,
        rpdLimit: 150_000,
    },
    {
        key: "gemini-embedding-2",
        model: "Gemini Embedding 2",
        category: "Other models",
        rpmLimit: 3000,
        tpmLimit: 1_000_000,
        rpdLimit: null,
    },
] as const;

const OTHER_PROVIDER_LIMITS = [
    "Resend: 100/day, 3,000/month",
    "Jina AI Reader: 20 RPM (no key), 100 RPM (key)",
    "Unsplash Demo: 50 req/hour",
    "OpenRouter (fallback): community limits",
] as const;

function formatCompact(value: number) {
    if (value >= 1_000_000) {
        const millions = value / 1_000_000;
        return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(2)}M`;
    }

    if (value >= 1000) {
        const thousands = value / 1000;
        return `${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(2)}K`;
    }

    return value.toString();
}

function LimitMetric({
    used,
    limit,
    limitLabel,
}: {
    used: number;
    limit: number | null;
    limitLabel?: string;
}) {
    const safeUsed = Number.isFinite(used) ? used : 0;
    const ratio =
        limit === null
            ? 0
            : Math.max(0, Math.min(100, (safeUsed / limit) * 100));
    const renderedLimit =
        limitLabel ?? (limit === null ? "Unlimited" : formatCompact(limit));

    return (
        <div className="min-w-[180px]">
            <div className="flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-muted/60">
                    <div
                        className="h-full rounded-full bg-foreground/70"
                        style={{ width: `${ratio}%` }}
                    />
                </div>
                <span className="text-xs tabular-nums text-muted-foreground">
                    {formatCompact(safeUsed)} / {renderedLimit}
                </span>
            </div>
        </div>
    );
}

export function ProviderLimitsCard() {
    const periodKey = useMemo(() => getCurrentPeriodKey(), []);
    const usageData = useAuthenticatedQuery(api.usage.getAgencyUsage, {
        periodKey,
    });

    const usageByProvider = useMemo(() => {
        const map = new Map<string, { calls: number; tokens: number }>();
        if (!usageData) return map;

        for (const row of usageData) {
            const providerKey = SERVICE_TO_PROVIDER[row.service];
            if (!providerKey) continue;

            const previous = map.get(providerKey) ?? { calls: 0, tokens: 0 };
            map.set(providerKey, {
                calls: previous.calls + row.callCount,
                tokens:
                    previous.tokens +
                    (row.promptTokens || 0) +
                    (row.completionTokens || 0),
            });
        }

        return map;
    }, [usageData]);

    const daysElapsed = Math.max(new Date().getDate(), 1);

    return (
        <Card className="gap-0 overflow-hidden rounded-2xl border-border/70 py-0 shadow-none">
            <CardHeader className="border-b px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                        <CardTitle className="text-base font-semibold">
                            Rate Limits by Model
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Internal tracked usage this month compared with your
                            configured provider limits.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-0 py-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead className="border-b bg-muted/20 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium">
                                    Model
                                </th>
                                <th className="px-4 py-2 text-left font-medium">
                                    Category
                                </th>
                                <th className="px-4 py-2 text-left font-medium">
                                    RPM
                                </th>
                                <th className="px-4 py-2 text-left font-medium">
                                    TPM
                                </th>
                                <th className="px-4 py-2 text-left font-medium">
                                    RPD
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {MODEL_LIMITS.map((row) => {
                                const usage = usageByProvider.get(row.key) ?? {
                                    calls: 0,
                                    tokens: 0,
                                };

                                const rpmUsed = Math.max(
                                    0,
                                    Math.max(
                                        usage.calls > 0 ? 1 : 0,
                                        Math.round(
                                            usage.calls /
                                                (daysElapsed * 24 * 60),
                                        ),
                                    ),
                                );
                                const tpmUsed = Math.max(0, usage.tokens);
                                const rpdUsed = Math.max(
                                    0,
                                    Math.max(
                                        usage.calls > 0 ? 1 : 0,
                                        Math.round(usage.calls / daysElapsed),
                                    ),
                                );

                                return (
                                    <tr
                                        key={row.key}
                                        className="border-b border-border/60 text-sm transition-colors hover:bg-muted/20"
                                    >
                                        <td className="px-4 py-3 font-medium">
                                            {row.model}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {row.category}
                                        </td>
                                        <td className="px-4 py-3">
                                            <LimitMetric
                                                used={rpmUsed}
                                                limit={row.rpmLimit}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <LimitMetric
                                                used={tpmUsed}
                                                limit={row.tpmLimit}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <LimitMetric
                                                used={rpdUsed}
                                                limit={row.rpdLimit}
                                                limitLabel={
                                                    row.rpdLimit === null
                                                        ? "Unlimited"
                                                        : undefined
                                                }
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t px-4 py-3">
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Other Providers
                    </span>
                    {OTHER_PROVIDER_LIMITS.map((limit) => (
                        <Badge
                            key={limit}
                            variant="outline"
                            className="rounded-md px-2 py-0.5 text-[11px] text-muted-foreground"
                        >
                            {limit}
                        </Badge>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
