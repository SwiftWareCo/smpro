"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUIMessages } from "@convex-dev/agent/react";
import { api } from "@/convex/_generated/api";
import type { Id, Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Bot,
    Send,
    X,
    User,
    Loader2,
    Clock,
    Plus,
    Trash2,
    MessageSquare,
    Command,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

type Stage = "closed" | "input" | "chat";

interface KBChatOverlayProps {
    clientId: Id<"clients">;
}

function formatRelativeTime(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
}

function ChatMessages({
    threadId,
    sendingState,
}: {
    threadId: string;
    sendingState: boolean;
}) {
    const { results: messages } = useUIMessages(
        api.kbChat.listThreadMessages,
        threadId ? { threadId } : "skip",
        { initialNumItems: 50, stream: true },
    );

    const scrollRef = useRef<HTMLDivElement>(null);
    const userIsAtBottomRef = useRef(true);

    const hasPending = messages.some((m) => m.status === "pending");
    const showThinking =
        sendingState ||
        (hasPending &&
            (messages.length === 0 ||
                messages[messages.length - 1]?.role !== "assistant"));

    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        userIsAtBottomRef.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    }, []);

    useEffect(() => {
        if (userIsAtBottomRef.current && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 space-y-3 overflow-y-auto p-4"
        >
            {messages.length === 0 && !sendingState && (
                <div className="flex h-full flex-col items-center justify-center text-center">
                    <Bot className="mb-2 h-8 w-8 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground">
                        Ask a question about your documents
                    </p>
                </div>
            )}

            {messages.map((message) => {
                if (message.role === "system") return null;

                const isUser = message.role === "user";
                const textContent = message.text || "";

                const sources: Array<{ title?: string; key?: string }> = [];
                for (const part of message.parts) {
                    if (
                        part.type === "tool-invocation" &&
                        "result" in part &&
                        part.result
                    ) {
                        const output = part.result as {
                            entries?: Array<{
                                title?: string;
                                key?: string;
                            }>;
                        } | null;
                        if (output?.entries) {
                            sources.push(...output.entries);
                        }
                    }
                }

                if (!textContent && sources.length === 0) return null;

                return (
                    <div
                        key={message.key}
                        className={cn(
                            "flex gap-2",
                            isUser ? "justify-end" : "justify-start",
                        )}
                    >
                        {!isUser && (
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                <Bot className="h-3 w-3 text-primary" />
                            </div>
                        )}
                        <div
                            className={cn(
                                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                                isUser
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted",
                            )}
                        >
                            {isUser ? (
                                <div className="whitespace-pre-wrap text-sm">
                                    {textContent}
                                </div>
                            ) : (
                                <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                                    <ReactMarkdown>
                                        {textContent}
                                    </ReactMarkdown>
                                </div>
                            )}
                            {sources.length > 0 && (
                                <div className="mt-2 border-t border-border/50 pt-2">
                                    <p className="text-[10px] font-medium text-muted-foreground">
                                        Sources:
                                    </p>
                                    <ul className="mt-0.5 space-y-0">
                                        {sources.map((s, i) => (
                                            <li
                                                key={i}
                                                className="text-[10px] text-muted-foreground"
                                            >
                                                {s.title ||
                                                    s.key ||
                                                    "Document"}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        {isUser && (
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                                <User className="h-3 w-3" />
                            </div>
                        )}
                    </div>
                );
            })}

            {showThinking && (
                <div className="flex gap-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-3 w-3 text-primary" />
                    </div>
                    <div className="rounded-lg bg-muted px-3 py-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    </div>
                </div>
            )}
        </div>
    );
}

function ThreadHistoryPopover({
    clientId,
    activeThreadId,
    onSelectThread,
    onNewChat,
}: {
    clientId: Id<"clients">;
    activeThreadId: string | null;
    onSelectThread: (agentThreadId: string) => void;
    onNewChat: () => void;
}) {
    const threads = useQuery(api.kbChat.listThreads, { clientId });
    const deleteThread = useMutation(api.kbChat.deleteThread);

    const handleDelete = async (threadId: Id<"kbThreads">) => {
        try {
            await deleteThread({ threadId });
            toast.success("Conversation deleted");
        } catch {
            toast.error("Failed to delete conversation");
        }
    };

    return (
        <PopoverContent align="start" className="w-72 p-0">
            <div className="border-b p-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onNewChat}
                    className="w-full gap-1.5"
                >
                    <Plus className="h-3 w-3" />
                    New Chat
                </Button>
            </div>
            <div className="max-h-64 overflow-y-auto p-1">
                {threads === undefined ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                ) : threads.length === 0 ? (
                    <div className="px-2 py-6 text-center text-xs text-muted-foreground">
                        No conversations yet
                    </div>
                ) : (
                    threads.map((thread: Doc<"kbThreads">) => (
                        <div
                            key={thread._id}
                            className={cn(
                                "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-muted",
                                activeThreadId === thread.agentThreadId &&
                                    "bg-muted font-medium",
                            )}
                            onClick={() =>
                                onSelectThread(thread.agentThreadId)
                            }
                        >
                            <MessageSquare className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs">
                                    {thread.title || "Untitled"}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                    {formatRelativeTime(thread.lastMessageAt)}
                                </p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 opacity-0 group-hover:opacity-100"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Trash2 className="h-2.5 w-2.5" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            Delete conversation?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete this
                                            conversation. This cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>
                                            Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() =>
                                                handleDelete(thread._id)
                                            }
                                        >
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))
                )}
            </div>
        </PopoverContent>
    );
}

export function KBChatOverlay({ clientId }: KBChatOverlayProps) {
    const [stage, setStage] = useState<Stage>("closed");
    const [threadId, setThreadId] = useState<string | null>(null);
    const [input, setInput] = useState("");
    const sendingRef = useRef(false);
    const [sendingState, setSendingState] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const chatInputRef = useRef<HTMLInputElement>(null);

    const startChat = useMutation(api.kbChat.startChat);

    // Cmd+K listener
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setStage((prev) => (prev === "closed" ? "input" : "closed"));
            }
            if (e.key === "Escape") {
                setStage("closed");
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    // Auto-focus input when stage changes to "input"
    useEffect(() => {
        if (stage === "input") {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
        if (stage === "chat") {
            setTimeout(() => chatInputRef.current?.focus(), 50);
        }
    }, [stage]);

    const handleSubmit = useCallback(
        async (e?: React.FormEvent) => {
            e?.preventDefault();
            const trimmed = input.trim();
            if (!trimmed || sendingRef.current) return;

            sendingRef.current = true;
            setSendingState(true);
            setInput("");

            try {
                const result = await startChat({
                    clientId,
                    threadId: threadId ?? undefined,
                    prompt: trimmed,
                });
                if (!threadId) {
                    setThreadId(result.threadId);
                }
                setStage("chat");
            } finally {
                sendingRef.current = false;
                setSendingState(false);
            }
        },
        [input, startChat, clientId, threadId],
    );

    const handleNewChat = () => {
        setThreadId(null);
        setInput("");
    };

    const handleSelectThread = (agentThreadId: string) => {
        setThreadId(agentThreadId);
        setStage("chat");
    };

    // --- Stage: closed --- FAB button
    if (stage === "closed") {
        return (
            <button
                onClick={() => setStage("input")}
                className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
                <Bot className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex items-center gap-0.5 rounded-md bg-muted px-1 py-0.5 text-[9px] font-medium text-muted-foreground shadow-sm border">
                    <Command className="h-2 w-2" />K
                </span>
            </button>
        );
    }

    // --- Stage: input --- Floating input bar
    if (stage === "input") {
        return (
            <>
                {/* Transparent backdrop */}
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setStage("closed")}
                />
                <div className="fixed bottom-8 left-1/2 z-50 w-full max-w-lg -translate-x-1/2">
                    <form
                        onSubmit={handleSubmit}
                        className="flex items-center gap-2 rounded-2xl border bg-background/95 px-4 py-3 shadow-2xl backdrop-blur"
                    >
                        <Bot className="h-5 w-5 shrink-0 text-primary" />
                        <Input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about your documents..."
                            className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0"
                            disabled={sendingState}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            variant="ghost"
                            disabled={sendingState || !input.trim()}
                            className="h-8 w-8 shrink-0"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                        <kbd className="hidden sm:inline-flex items-center rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            Esc
                        </kbd>
                    </form>
                </div>
            </>
        );
    }

    // --- Stage: chat --- Floating panel
    return (
        <>
            {/* Transparent backdrop */}
            <div
                className="fixed inset-0 z-40"
                onClick={() => setStage("closed")}
            />
            <div
                className="fixed bottom-8 right-8 z-50 flex w-[420px] flex-col rounded-2xl border bg-background/95 shadow-2xl backdrop-blur"
                style={{ height: "520px" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                            AI Assistant
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                >
                                    <Clock className="h-3.5 w-3.5" />
                                </Button>
                            </PopoverTrigger>
                            <ThreadHistoryPopover
                                clientId={clientId}
                                activeThreadId={threadId}
                                onSelectThread={handleSelectThread}
                                onNewChat={handleNewChat}
                            />
                        </Popover>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setStage("closed")}
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Messages */}
                {threadId ? (
                    <ChatMessages
                        threadId={threadId}
                        sendingState={sendingState}
                    />
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center text-center p-4">
                        <Bot className="mb-2 h-8 w-8 text-muted-foreground/50" />
                        <p className="text-xs text-muted-foreground">
                            Ask a question about your documents
                        </p>
                    </div>
                )}

                {/* Input */}
                <form
                    onSubmit={handleSubmit}
                    className="flex items-center gap-2 border-t px-3 py-2"
                >
                    <Input
                        ref={chatInputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question..."
                        disabled={sendingState}
                        className="flex-1 text-sm"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={sendingState || !input.trim()}
                        className="h-8 w-8"
                    >
                        <Send className="h-3.5 w-3.5" />
                    </Button>
                </form>
            </div>
        </>
    );
}
