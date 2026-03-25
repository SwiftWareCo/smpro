"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Activity, Hash, Sparkles, TrendingUp } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import type { Id } from "@/convex/_generated/dataModel";
import {
    getCurrentPeriodKey,
    getLastNPeriodKeys,
    formatPeriodKey,
    SERVICE_DISPLAY_NAMES,
    SERVICE_COLORS,
} from "@/lib/usage-utils";

interface UsageTabProps {
    clientId: Id<"clients">;
}

export function UsageTab({ clientId }: UsageTabProps) {
    const periodOptions = useMemo(() => getLastNPeriodKeys(6), []);
    const [selectedPeriod, setSelectedPeriod] = useState(getCurrentPeriodKey());

    const usageData = useAuthenticatedQuery(api.usage.getClientUsage, {
        clientId,
        periodKey: selectedPeriod,
    });

    const chartData = useMemo(() => {
        if (!usageData) return [];
        return usageData
            .map((row) => ({
                service: SERVICE_DISPLAY_NAMES[row.service] ?? row.service,
                calls: row.callCount,
                tokens: (row.promptTokens || 0) + (row.completionTokens || 0),
                fill: SERVICE_COLORS[row.service] ?? "hsl(210, 40%, 50%)",
            }))
            .sort((a, b) => b.calls - a.calls);
    }, [usageData]);

    const chartConfig: ChartConfig = useMemo(() => {
        const config: ChartConfig = {
            calls: { label: "API Calls" },
        };
        if (usageData) {
            for (const row of usageData) {
                const key =
                    SERVICE_DISPLAY_NAMES[row.service] ?? row.service;
                config[key] = {
                    label: key,
                    color:
                        SERVICE_COLORS[row.service] ??
                        "hsl(210, 40%, 50%)",
                };
            }
        }
        return config;
    }, [usageData]);

    const totals = useMemo(() => {
        if (!usageData || usageData.length === 0) {
            return {
                calls: 0,
                tokens: 0,
                topService: "None",
            };
        }
        let calls = 0;
        let tokens = 0;
        let topService = "";
        let topCalls = 0;
        for (const row of usageData) {
            calls += row.callCount;
            tokens += (row.promptTokens || 0) + (row.completionTokens || 0);
            if (row.callCount > topCalls) {
                topCalls = row.callCount;
                topService = row.service;
            }
        }
        return {
            calls,
            tokens,
            topService:
                SERVICE_DISPLAY_NAMES[topService] ?? topService ?? "None",
        };
    }, [usageData]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Usage</h3>
                    <p className="text-sm text-muted-foreground">
                        AI and API usage for this client
                    </p>
                </div>
                <Select
                    value={selectedPeriod}
                    onValueChange={setSelectedPeriod}
                >
                    <SelectTrigger className="w-[160px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {periodOptions.map((key) => (
                            <SelectItem key={key} value={key}>
                                {formatPeriodKey(key)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Summary cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Calls
                        </CardTitle>
                        <Hash className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {totals.calls.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Tokens
                        </CardTitle>
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {totals.tokens.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Most Active
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {totals.topService}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bar chart */}
            {chartData.length > 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Calls by Service</CardTitle>
                        <CardDescription>
                            {formatPeriodKey(selectedPeriod)}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer
                            config={chartConfig}
                            className="aspect-auto h-[300px] w-full"
                        >
                            <BarChart
                                data={chartData}
                                layout="vertical"
                                margin={{ left: 10, right: 10 }}
                            >
                                <CartesianGrid horizontal={false} />
                                <YAxis
                                    dataKey="service"
                                    type="category"
                                    width={120}
                                    tickLine={false}
                                    axisLine={false}
                                    fontSize={12}
                                />
                                <XAxis type="number" hide />
                                <ChartTooltip
                                    content={<ChartTooltipContent />}
                                />
                                <Bar
                                    dataKey="calls"
                                    radius={[0, 4, 4, 0]}
                                    fill="hsl(220, 70%, 55%)"
                                />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Activity className="h-10 w-10 text-muted-foreground/40" />
                        <p className="mt-3 text-sm text-muted-foreground">
                            No usage data for this period
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Detailed table */}
            {usageData && usageData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Service Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Service</TableHead>
                                    <TableHead className="text-right">
                                        Calls
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Prompt Tokens
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Completion Tokens
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Total Tokens
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {usageData
                                    .sort(
                                        (a, b) =>
                                            b.callCount - a.callCount,
                                    )
                                    .map((row) => (
                                        <TableRow key={row._id}>
                                            <TableCell className="font-medium">
                                                {SERVICE_DISPLAY_NAMES[
                                                    row.service
                                                ] ?? row.service}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {row.callCount.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {row.promptTokens.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {row.completionTokens.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {(
                                                    (row.promptTokens || 0) +
                                                    (row.completionTokens || 0)
                                                ).toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
