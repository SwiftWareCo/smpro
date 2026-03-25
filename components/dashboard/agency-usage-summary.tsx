"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Activity, Hash, Sparkles, Users } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { useAuthenticatedQuery } from "@/hooks/use-authenticated-query";
import { api } from "@/convex/_generated/api";
import {
    getCurrentPeriodKey,
    formatPeriodKey,
    SERVICE_DISPLAY_NAMES,
    SERVICE_COLORS,
} from "@/lib/usage-utils";

export function AgencyUsageSummary() {
    const periodKey = useMemo(() => getCurrentPeriodKey(), []);

    const usageData = useAuthenticatedQuery(api.usage.getAgencyUsage, {
        periodKey,
    });

    const clients = useAuthenticatedQuery(api.clients.list, {});

    const clientNameMap = useMemo(() => {
        if (!clients) return new Map<string, string>();
        return new Map(clients.map((c) => [c._id, c.name]));
    }, [clients]);

    // Aggregate by service across all clients
    const byService = useMemo(() => {
        if (!usageData) return [];
        const map = new Map<string, { calls: number; tokens: number }>();
        for (const row of usageData) {
            const prev = map.get(row.service) ?? { calls: 0, tokens: 0 };
            map.set(row.service, {
                calls: prev.calls + row.callCount,
                tokens:
                    prev.tokens +
                    (row.promptTokens || 0) +
                    (row.completionTokens || 0),
            });
        }
        return Array.from(map.entries())
            .map(([service, data]) => ({
                service: SERVICE_DISPLAY_NAMES[service] ?? service,
                serviceKey: service,
                calls: data.calls,
                tokens: data.tokens,
                fill: SERVICE_COLORS[service] ?? "hsl(210, 40%, 50%)",
            }))
            .sort((a, b) => b.calls - a.calls);
    }, [usageData]);

    // Aggregate by client
    const byClient = useMemo(() => {
        if (!usageData) return [];
        const map = new Map<string, { calls: number; tokens: number }>();
        for (const row of usageData) {
            const prev = map.get(row.clientId) ?? {
                calls: 0,
                tokens: 0,
            };
            map.set(row.clientId, {
                calls: prev.calls + row.callCount,
                tokens:
                    prev.tokens +
                    (row.promptTokens || 0) +
                    (row.completionTokens || 0),
            });
        }
        return Array.from(map.entries())
            .map(([clientId, data]) => ({
                clientId,
                ...data,
            }))
            .sort((a, b) => b.calls - a.calls)
            .slice(0, 5);
    }, [usageData]);

    const totals = useMemo(() => {
        if (!usageData || usageData.length === 0) {
            return { calls: 0, tokens: 0, clients: 0 };
        }
        let calls = 0;
        let tokens = 0;
        const clientSet = new Set<string>();
        for (const row of usageData) {
            calls += row.callCount;
            tokens += (row.promptTokens || 0) + (row.completionTokens || 0);
            clientSet.add(row.clientId);
        }
        return { calls, tokens, clients: clientSet.size };
    }, [usageData]);

    const chartConfig: ChartConfig = useMemo(() => {
        const config: ChartConfig = {
            calls: { label: "API Calls" },
        };
        for (const item of byService) {
            config[item.service] = {
                label: item.service,
                color: item.fill,
            };
        }
        return config;
    }, [byService]);

    if (usageData && usageData.length === 0) {
        return null;
    }

    return (
        <Card className="gap-0 overflow-hidden rounded-2xl border-border/70 py-0 shadow-none">
            <CardHeader className="gap-1 border-b px-4 py-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Activity className="h-4 w-4" />
                    AI & API Usage This Month
                </CardTitle>
                <CardDescription className="text-xs">
                    {formatPeriodKey(periodKey)} — aggregated across all clients
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 py-4">
                {/* Summary row */}
                <div className="grid gap-2 sm:grid-cols-3">
                    <div className="flex items-center gap-2 rounded-lg border bg-muted/20 p-2.5">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Total Calls
                            </p>
                            <p className="text-lg font-semibold tabular-nums">
                                {totals.calls.toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border bg-muted/20 p-2.5">
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Total Tokens
                            </p>
                            <p className="text-lg font-semibold tabular-nums">
                                {totals.tokens.toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border bg-muted/20 p-2.5">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Active Clients
                            </p>
                            <p className="text-lg font-semibold tabular-nums">
                                {totals.clients}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bar chart by service */}
                {byService.length > 0 && (
                    <ChartContainer
                        config={chartConfig}
                        className="aspect-auto h-[200px] w-full"
                    >
                        <BarChart
                            data={byService}
                            layout="vertical"
                            margin={{ left: 10, right: 10 }}
                        >
                            <CartesianGrid horizontal={false} />
                            <YAxis
                                dataKey="service"
                                type="category"
                                width={100}
                                tickLine={false}
                                axisLine={false}
                                fontSize={11}
                            />
                            <XAxis type="number" hide />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar
                                dataKey="calls"
                                radius={[0, 3, 3, 0]}
                                fill="hsl(220, 70%, 55%)"
                            />
                        </BarChart>
                    </ChartContainer>
                )}

                {/* Top clients table */}
                {byClient.length > 0 && (
                    <div>
                        <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Top Clients by Usage
                        </h4>
                        <Table className="text-xs">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Client</TableHead>
                                    <TableHead className="text-right">
                                        Calls
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Tokens
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {byClient.map((row) => (
                                    <TableRow key={row.clientId}>
                                        <TableCell className="font-medium">
                                            {clientNameMap.get(row.clientId) ??
                                                row.clientId}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {row.calls.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {row.tokens.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
