"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "convex/react";
import { useUIMessages } from "@convex-dev/agent/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface KBChatProps {
    clientId: Id<"clients">;
}

export function KBChat({ clientId }: KBChatProps) {
    const [input, setInput] = useState("");
    const [threadId, setThreadId] = useState<string | null>(null);
    const sendingRef = useRef(false);
    const [sendingState, setSendingState] = useState(false);

    const startChat = useMutation(api.kbChat.startChat);

    const { results: messages } = useUIMessages(
        api.kbChat.listThreadMessages,
        threadId ? { threadId } : "skip",
        { initialNumItems: 50, stream: true },
    );

    const scrollRef = useRef<HTMLDivElement>(null);
    const userIsAtBottomRef = useRef(true);
    const inputRef = useRef<HTMLInputElement>(null);

    const isStreaming = messages.some((m) => m.status === "streaming");
    const hasPending = messages.some((m) => m.status === "pending");

    // Show thinking indicator only when we've sent but no assistant message has appeared yet
    const showThinking =
        sendingState ||
        (hasPending &&
            (messages.length === 0 ||
                messages[messages.length - 1]?.role !== "assistant"));

    // Track whether user is scrolled to bottom
    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const threshold = 40;
        userIsAtBottomRef.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    }, []);

    // Auto-scroll only when user is at the bottom
    useEffect(() => {
        if (userIsAtBottomRef.current && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

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
            } finally {
                sendingRef.current = false;
                setSendingState(false);
            }
        },
        [input, startChat, clientId, threadId],
    );

    const handleNewChat = useCallback(() => {
        setThreadId(null);
        setInput("");
        inputRef.current?.focus();
    }, []);

    return (
        <div className="flex h-[500px] flex-col rounded-lg border">
            {/* Header */}
            {threadId && (
                <div className="flex items-center justify-end border-b px-3 py-1.5">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleNewChat}
                        className="h-7 gap-1.5 text-xs text-muted-foreground"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        New Chat
                    </Button>
                </div>
            )}

            {/* Messages area */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 space-y-4 overflow-y-auto p-4"
            >
                {messages.length === 0 && !sendingState && (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                        <Bot className="mb-3 h-10 w-10 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">
                            Ask a question about your documents
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground/70">
                            The AI will search your knowledge base to find
                            answers
                        </p>
                    </div>
                )}

                {messages.map((message) => {
                    if (message.role === "system") return null;

                    const isUser = message.role === "user";
                    const textContent = message.text || "";

                    // Extract source info from tool-result parts
                    const sources: Array<{
                        title?: string;
                        key?: string;
                    }> = [];
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
                                "flex gap-3",
                                isUser ? "justify-end" : "justify-start",
                            )}
                        >
                            {!isUser && (
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                    <Bot className="h-4 w-4 text-primary" />
                                </div>
                            )}
                            <div
                                className={cn(
                                    "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                                    isUser
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted",
                                )}
                            >
                                {isUser ? (
                                    <div className="whitespace-pre-wrap">
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
                                        <p className="text-xs font-medium text-muted-foreground">
                                            Sources:
                                        </p>
                                        <ul className="mt-1 space-y-0.5">
                                            {sources.map((s, i) => (
                                                <li
                                                    key={i}
                                                    className="text-xs text-muted-foreground"
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
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                                    <User className="h-4 w-4" />
                                </div>
                            )}
                        </div>
                    );
                })}

                {showThinking && (
                    <div className="flex gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="rounded-lg bg-muted px-3 py-2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input area */}
            <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 border-t p-3"
            >
                <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question about your documents..."
                    disabled={sendingState}
                    className="flex-1"
                    autoFocus
                />
                <Button
                    type="submit"
                    size="icon"
                    disabled={sendingState || !input.trim()}
                >
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    );
}
