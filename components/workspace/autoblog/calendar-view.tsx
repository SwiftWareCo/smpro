"use client";

import { useState, useMemo } from "react";
import { api } from "@/convex/_generated/api";
import type { Id, Doc } from "@/convex/_generated/dataModel";
import { useAuthenticatedQuery } from "@/hooks/use-authenticated-query";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
    startOfMonth,
    endOfMonth,
    format,
    isSameDay,
    addMonths,
    subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, FileText, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type PostStatus = "draft" | "scheduled" | "publishing" | "published" | "failed";

interface CalendarViewProps {
    clientId: Id<"clients">;
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

export function CalendarView({ clientId }: CalendarViewProps) {
    const router = useRouter();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const startDate = startOfMonth(currentMonth).getTime();
    const endDate = endOfMonth(currentMonth).getTime();

    const posts = useAuthenticatedQuery(api.autoblog.listPostsForCalendar, {
        clientId,
        startDate,
        endDate,
    });

    const postsByDate = useMemo(() => {
        if (!posts) return new Map<string, Doc<"autoblogPosts">[]>();

        const map = new Map<string, Doc<"autoblogPosts">[]>();
        posts.forEach((post) => {
            const date = new Date(post.scheduledFor ?? post.publishedAt ?? post.createdAt);
            const dateKey = format(date, "yyyy-MM-dd");
            const existing = map.get(dateKey) || [];
            map.set(dateKey, [...existing, post]);
        });
        return map;
    }, [posts]);

    const selectedDatePosts = useMemo(() => {
        if (!selectedDate) return [];
        const dateKey = format(selectedDate, "yyyy-MM-dd");
        return postsByDate.get(dateKey) || [];
    }, [selectedDate, postsByDate]);

    const handlePreviousMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    const handlePostClick = (postId: Id<"autoblogPosts">) => {
        router.push(`/workspace/${clientId}/autoblog/posts/${postId}`);
    };

    const modifiers = useMemo(() => {
        const datesWithPosts: Date[] = [];
        postsByDate.forEach((_, dateKey) => {
            datesWithPosts.push(new Date(dateKey));
        });
        return { hasPost: datesWithPosts };
    }, [postsByDate]);

    if (posts === undefined) {
        return (
            <div className="flex items-center justify-center py-12">
                <Spinner className="size-6" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Content Calendar</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handlePreviousMonth}
                            >
                                <ChevronLeft className="size-4" />
                            </Button>
                            <span className="min-w-[140px] text-center font-medium">
                                {format(currentMonth, "MMMM yyyy")}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleNextMonth}
                            >
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Calendar
                        mode="single"
                        selected={selectedDate ?? undefined}
                        onSelect={(date) => setSelectedDate(date ?? null)}
                        month={currentMonth}
                        onMonthChange={setCurrentMonth}
                        modifiers={modifiers}
                        className="w-full"
                        classNames={{
                            months: "w-full",
                            month: "w-full",
                            table: "w-full",
                            head_row: "flex w-full",
                            head_cell: "flex-1 text-center",
                            row: "flex w-full mt-2",
                            cell: "flex-1 text-center relative",
                            day: cn(
                                "w-full h-auto min-h-[60px] p-1 flex flex-col items-center justify-start gap-1",
                                "hover:bg-accent rounded-md cursor-pointer",
                            ),
                        }}
                        components={{
                            DayButton: ({ day, modifiers: dayModifiers, ...props }) => {
                                const dateKey = format(day.date, "yyyy-MM-dd");
                                const dayPosts = postsByDate.get(dateKey) || [];
                                const isSelected = selectedDate && isSameDay(day.date, selectedDate);

                                return (
                                    <button
                                        {...props}
                                        className={cn(
                                            "w-full min-h-[60px] p-1 flex flex-col items-center justify-start gap-1 rounded-md transition-colors",
                                            "hover:bg-accent",
                                            isSelected && "bg-accent",
                                            dayModifiers.today && "font-bold",
                                            dayModifiers.outside && "text-muted-foreground opacity-50",
                                        )}
                                    >
                                        <span className="text-sm">{day.date.getDate()}</span>
                                        {dayPosts.length > 0 && (
                                            <div className="flex flex-wrap gap-0.5 justify-center">
                                                {dayPosts.slice(0, 3).map((post) => (
                                                    <div
                                                        key={post._id}
                                                        className={cn(
                                                            "size-2 rounded-full",
                                                            statusColors[post.status as PostStatus],
                                                        )}
                                                        title={post.title}
                                                    />
                                                ))}
                                                {dayPosts.length > 3 && (
                                                    <span className="text-xs text-muted-foreground">
                                                        +{dayPosts.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                );
                            },
                        }}
                    />

                    {/* Status Legend */}
                    <div className="mt-4 flex flex-wrap gap-4 text-sm">
                        {Object.entries(statusColors).map(([status, color]) => (
                            <div key={status} className="flex items-center gap-1.5">
                                <div className={cn("size-2.5 rounded-full", color)} />
                                <span className="text-muted-foreground">
                                    {statusLabels[status as PostStatus]}
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Selected Date Posts */}
            {selectedDate && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">
                            {format(selectedDate, "EEEE, MMMM d, yyyy")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedDatePosts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No posts scheduled for this date.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {selectedDatePosts.map((post) => (
                                    <div
                                        key={post._id}
                                        className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText className="size-4 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium text-sm">{post.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {post.scheduledFor
                                                        ? format(new Date(post.scheduledFor), "h:mm a")
                                                        : "No time set"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant="secondary"
                                                className={cn(
                                                    "text-white text-xs",
                                                    statusColors[post.status as PostStatus],
                                                )}
                                            >
                                                {statusLabels[post.status as PostStatus]}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handlePostClick(post._id)}
                                            >
                                                <Eye className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
