"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery } from "convex/react";
import { useUIMessages } from "@convex-dev/agent/react";
import { Rnd } from "react-rnd";
import { api } from "@/convex/_generated/api";
import type { Id, Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePortalClient } from "@/components/portal/portal-client-provider";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
import { buildTenantThemeStyle } from "@/lib/tenant-theme";

type Stage = "closed" | "input" | "chat";

interface KBChatOverlayProps {
    clientId: Id<"clients">;
}

const ASSISTANT_NAME = "Astra";
const TENANT_SCROLLBAR_CLASS =
    "[scrollbar-width:thin] [scrollbar-color:var(--primary)_var(--muted)] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-muted/35 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary/35 hover:[&::-webkit-scrollbar-thumb]:bg-primary/55";
const COMPOSER_MIN_HEIGHT = 40;
const COMPOSER_MAX_HEIGHT = 128;
const DESKTOP_BREAKPOINT = 640;
const DESKTOP_PANEL_MARGIN = 32;
const DESKTOP_PANEL_MIN_WIDTH = 420;
const DESKTOP_PANEL_MIN_HEIGHT = 420;
const DESKTOP_PANEL_HEIGHT = 520;
const DESKTOP_PANEL_WIDTH = 460;
const DESKTOP_PANEL_WIDTH_WITH_SESSIONS = 760;
const DESKTOP_PANEL_MAX_WIDTH_RATIO = 0.92;
const DESKTOP_PANEL_MAX_HEIGHT_RATIO = 0.85;
const PANEL_PERSIST_KEY_PREFIX = "kb-chat-panel:v1";

interface ChatSyncState {
    hasAssistantActivity: boolean;
    optimisticMatched: boolean;
}

interface PersistedPanelState {
    x: number;
    y: number;
    width: number;
    height: number;
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function getViewportSize() {
    if (typeof window === "undefined") {
        return { width: 0, height: 0 };
    }
    const visual = window.visualViewport;
    if (visual) {
        return {
            width: Math.floor(visual.width),
            height: Math.floor(visual.height),
        };
    }
    return {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
    };
}

function getDesktopMaxWidth(viewportWidth: number) {
    if (viewportWidth <= 0) return DESKTOP_PANEL_WIDTH_WITH_SESSIONS;
    return Math.max(
        0,
        Math.min(
            viewportWidth * DESKTOP_PANEL_MAX_WIDTH_RATIO,
            viewportWidth - DESKTOP_PANEL_MARGIN,
        ),
    );
}

function getDesktopMaxHeight(viewportHeight: number) {
    if (viewportHeight <= 0) return DESKTOP_PANEL_HEIGHT;
    return Math.max(
        0,
        Math.min(
            viewportHeight * DESKTOP_PANEL_MAX_HEIGHT_RATIO,
            viewportHeight - DESKTOP_PANEL_MARGIN,
        ),
    );
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

function ThinkingBubble() {
    return (
        <div className="flex justify-start gap-2">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-3 w-3 text-primary" />
            </div>
            <div className="max-w-[85%]">
                <p className="mb-1 mt-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
                    {ASSISTANT_NAME}
                </p>
                <div className="rounded-lg bg-muted px-3 py-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                </div>
            </div>
        </div>
    );
}

function UserBubble({
    text,
    optimistic = false,
}: {
    text: string;
    optimistic?: boolean;
}) {
    return (
        <div className="flex justify-end gap-2">
            <div
                className={cn(
                    "max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground",
                    optimistic && "opacity-80",
                )}
            >
                <div className="whitespace-pre-wrap text-sm">{text}</div>
            </div>
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                <User className="h-3 w-3" />
            </div>
        </div>
    );
}

function ChatMessages({
    threadId,
    sendingState,
    optimisticPrompt,
    onSyncState,
}: {
    threadId: string;
    sendingState: boolean;
    optimisticPrompt: string | null;
    onSyncState: (state: ChatSyncState) => void;
}) {
    const { results: messages } = useUIMessages(
        api.kbChat.listThreadMessages,
        threadId ? { threadId } : "skip",
        { initialNumItems: 50, stream: true },
    );

    const scrollRef = useRef<HTMLDivElement>(null);
    const userIsAtBottomRef = useRef(true);

    const hasPending = messages.some((m) => m.status === "pending");
    const hasAssistantActivity = messages.some(
        (m) =>
            m.role === "assistant" &&
            (m.status === "pending" ||
                (m.text?.trim()?.length ?? 0) > 0 ||
                m.parts.length > 0),
    );

    const optimisticMatched =
        optimisticPrompt !== null
            ? [...messages]
                  .reverse()
                  .some(
                      (m) =>
                          m.role === "user" &&
                          (m.text ?? "").trim() === optimisticPrompt.trim(),
                  )
            : false;

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
        const shouldForceAutoScroll =
            sendingState || hasPending || optimisticPrompt !== null;
        if (
            (userIsAtBottomRef.current || shouldForceAutoScroll) &&
            scrollRef.current
        ) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [hasPending, messages, optimisticPrompt, sendingState]);

    useEffect(() => {
        userIsAtBottomRef.current = true;
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [threadId]);

    useEffect(() => {
        onSyncState({
            hasAssistantActivity: hasPending || hasAssistantActivity,
            optimisticMatched,
        });
    }, [hasAssistantActivity, hasPending, onSyncState, optimisticMatched]);

    return (
        <div
            ref={scrollRef}
            onScroll={handleScroll}
            className={cn(
                "flex-1 space-y-3 overflow-y-auto p-4",
                TENANT_SCROLLBAR_CLASS,
            )}
        >
            {messages.length === 0 && !sendingState && !optimisticPrompt && (
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

                if (isUser) {
                    return <UserBubble key={message.key} text={textContent} />;
                }

                return (
                    <div key={message.key} className="flex justify-start gap-2">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Bot className="h-3 w-3 text-primary" />
                        </div>
                        <div className="max-w-[85%]">
                            <p className="mb-1 mt-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
                                {ASSISTANT_NAME}
                            </p>
                            <div className="rounded-lg bg-muted px-3 py-2 text-sm">
                                <div className="prose prose-sm dark:prose-invert max-w-none leading-6 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                                    <ReactMarkdown
                                        components={{
                                            p: ({ children }) => (
                                                <p className="mb-3 whitespace-pre-wrap leading-6 last:mb-0">
                                                    {children}
                                                </p>
                                            ),
                                            li: ({ children }) => (
                                                <li className="my-1 leading-6">
                                                    {children}
                                                </li>
                                            ),
                                        }}
                                    >
                                        {textContent}
                                    </ReactMarkdown>
                                </div>
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
                        </div>
                    </div>
                );
            })}

            {optimisticPrompt && !optimisticMatched && (
                <UserBubble text={optimisticPrompt} optimistic />
            )}

            {showThinking && <ThinkingBubble />}
        </div>
    );
}

function ThreadHistoryPanel({
    clientId,
    activeThreadId,
    onSelectThread,
    onNewChat,
    dialogStyle,
}: {
    clientId: Id<"clients">;
    activeThreadId: string | null;
    onSelectThread: (agentThreadId: string) => void;
    onNewChat: () => void;
    dialogStyle: CSSProperties;
}) {
    const threads = useQuery(api.kbChat.listThreads, { clientId });
    const deleteThread = useMutation(api.kbChat.deleteThread);

    const handleDelete = async (thread: Doc<"kbThreads">) => {
        try {
            await deleteThread({ threadId: thread._id });
            if (activeThreadId === thread.agentThreadId) {
                onNewChat();
            }
            toast.success("Conversation deleted");
        } catch {
            toast.error("Failed to delete conversation");
        }
    };

    return (
        <div className="flex h-full w-56 shrink-0 flex-col border-r bg-muted/10">
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
            <div
                className={cn(
                    "min-h-0 flex-1 space-y-2 overflow-y-auto p-1",
                    TENANT_SCROLLBAR_CLASS,
                )}
            >
                {threads === undefined ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                ) : threads.length === 0 ? (
                    <div className="px-2 py-6 text-center text-xs text-muted-foreground">
                        No conversations yet
                    </div>
                ) : (
                    threads.map((thread) => (
                        <div
                            key={thread._id}
                            className={cn(
                                "group relative cursor-pointer rounded-lg border border-transparent px-2.5 py-2 text-sm transition-colors hover:border-primary/35 hover:bg-primary/12 hover:text-foreground",
                                activeThreadId === thread.agentThreadId &&
                                    "border-primary/45 bg-primary/20 font-medium",
                            )}
                            onClick={() => onSelectThread(thread.agentThreadId)}
                        >
                            <div className="flex items-start gap-2">
                                <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs">
                                        {thread.title || "Untitled"}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {formatRelativeTime(
                                            thread.lastMessageAt,
                                        )}
                                    </p>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 transition-all duration-150 group-hover:opacity-100 hover:bg-destructive/15 hover:text-destructive focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-destructive/50"
                                            onPointerDown={(e) =>
                                                e.stopPropagation()
                                            }
                                            onMouseDown={(e) =>
                                                e.stopPropagation()
                                            }
                                            onClick={(e) => {
                                                e.stopPropagation();
                                            }}
                                        >
                                            <Trash2 className="h-2.5 w-2.5" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent
                                        className="force-light"
                                        style={dialogStyle}
                                        showCloseButton={false}
                                    >
                                        <DialogHeader>
                                            <DialogTitle>
                                                Delete conversation?
                                            </DialogTitle>
                                            <DialogDescription>
                                                This will permanently delete
                                                this conversation. This cannot
                                                be undone.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button variant="outline">
                                                    Cancel
                                                </Button>
                                            </DialogClose>
                                            <DialogClose asChild>
                                                <Button
                                                    variant="destructive"
                                                    onClick={() =>
                                                        handleDelete(thread)
                                                    }
                                                >
                                                    Delete
                                                </Button>
                                            </DialogClose>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export function KBChatOverlay({ clientId }: KBChatOverlayProps) {
    const { portalPrimaryColor, portalSecondaryColor } = usePortalClient();
    const [stage, setStage] = useState<Stage>("closed");
    const [threadId, setThreadId] = useState<string | null>(null);
    const [input, setInput] = useState("");
    const [sendingState, setSendingState] = useState(false);
    const [sessionsOpen, setSessionsOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(() =>
        typeof window !== "undefined"
            ? getViewportSize().width >= DESKTOP_BREAKPOINT
            : false,
    );
    const [viewportSize, setViewportSize] = useState(() => getViewportSize());
    const [panelSize, setPanelSize] = useState({
        width: DESKTOP_PANEL_WIDTH,
        height: DESKTOP_PANEL_HEIGHT,
    });
    const [panelPosition, setPanelPosition] = useState<{
        x: number;
        y: number;
    } | null>(null);
    const [optimisticPrompt, setOptimisticPrompt] = useState<string | null>(
        null,
    );

    const sendingRef = useRef(false);
    const hasLoadedPersistedPanelRef = useRef(false);
    const settleTimerRef = useRef<number | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const chatInputRef = useRef<HTMLTextAreaElement>(null);
    const panelStorageKey = `${PANEL_PERSIST_KEY_PREFIX}:${clientId}`;

    const startChat = useMutation(api.kbChat.startChat);
    const tenantDialogStyle = buildTenantThemeStyle({
        primaryColor: portalPrimaryColor,
        secondaryColor: portalSecondaryColor,
    });

    const clearSettleTimer = useCallback(() => {
        if (settleTimerRef.current !== null) {
            window.clearTimeout(settleTimerRef.current);
            settleTimerRef.current = null;
        }
    }, []);

    const resizeComposer = useCallback((el: HTMLTextAreaElement | null) => {
        if (!el) return;
        el.style.height = "0px";
        const nextHeight = Math.max(
            COMPOSER_MIN_HEIGHT,
            Math.min(el.scrollHeight, COMPOSER_MAX_HEIGHT),
        );
        el.style.height = `${nextHeight}px`;
    }, []);

    useEffect(() => {
        return () => {
            clearSettleTimer();
        };
    }, [clearSettleTimer]);

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

    // Auto-focus input when stage changes
    useEffect(() => {
        if (stage === "input") {
            setTimeout(() => {
                inputRef.current?.focus();
                resizeComposer(inputRef.current);
            }, 50);
        }
        if (stage === "chat") {
            setTimeout(() => {
                chatInputRef.current?.focus();
                resizeComposer(chatInputRef.current);
            }, 50);
        }
    }, [resizeComposer, stage]);

    useEffect(() => {
        if (input.trim().length > 0) return;
        resizeComposer(inputRef.current);
        resizeComposer(chatInputRef.current);
    }, [input, resizeComposer]);

    useEffect(() => {
        if (stage === "closed") return;
        const html = document.documentElement;
        const body = document.body;
        const prevHtmlOverflow = html.style.overflow;
        const prevBodyOverflow = body.style.overflow;
        const prevBodyPaddingRight = body.style.paddingRight;
        const scrollbarWidth = window.innerWidth - html.clientWidth;
        const clampedScrollbarWidth = clamp(scrollbarWidth, 0, 24);

        html.style.overflow = "hidden";
        body.style.overflow = "hidden";
        if (clampedScrollbarWidth > 0) {
            body.style.paddingRight = `${clampedScrollbarWidth}px`;
        }

        return () => {
            html.style.overflow = prevHtmlOverflow;
            body.style.overflow = prevBodyOverflow;
            body.style.paddingRight = prevBodyPaddingRight;
        };
    }, [stage]);

    useEffect(() => {
        const handleResize = () => {
            const nextViewport = getViewportSize();
            setViewportSize(nextViewport);
            setIsDesktop(nextViewport.width >= DESKTOP_BREAKPOINT);
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        const visual = window.visualViewport;
        visual?.addEventListener("resize", handleResize);
        visual?.addEventListener("scroll", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
            visual?.removeEventListener("resize", handleResize);
            visual?.removeEventListener("scroll", handleResize);
        };
    }, []);

    useEffect(() => {
        if (!isDesktop || !sessionsOpen) return;
        const maxWidthForViewport = getDesktopMaxWidth(viewportSize.width);
        const minSessionsWidth = clamp(
            DESKTOP_PANEL_WIDTH_WITH_SESSIONS,
            DESKTOP_PANEL_MIN_WIDTH,
            maxWidthForViewport,
        );
        setPanelSize((prev) =>
            prev.width >= minSessionsWidth
                ? prev
                : { ...prev, width: minSessionsWidth },
        );
    }, [isDesktop, sessionsOpen, viewportSize.width]);

    useEffect(() => {
        if (!isDesktop) return;
        const maxWidthForViewport = getDesktopMaxWidth(viewportSize.width);
        const maxHeightForViewport = getDesktopMaxHeight(viewportSize.height);
        const minWidthForViewport = Math.min(
            sessionsOpen
                ? DESKTOP_PANEL_WIDTH_WITH_SESSIONS
                : DESKTOP_PANEL_MIN_WIDTH,
            maxWidthForViewport,
        );
        const minHeightForViewport = Math.min(
            DESKTOP_PANEL_MIN_HEIGHT,
            maxHeightForViewport,
        );

        setPanelSize((prev) => {
            const next = {
                width: clamp(
                    prev.width,
                    minWidthForViewport,
                    maxWidthForViewport,
                ),
                height: clamp(
                    prev.height,
                    minHeightForViewport,
                    maxHeightForViewport,
                ),
            };
            if (next.width === prev.width && next.height === prev.height) {
                return prev;
            }
            return next;
        });
    }, [isDesktop, sessionsOpen, viewportSize.height, viewportSize.width]);

    useEffect(() => {
        if (!isDesktop) return;
        setPanelPosition((prev) => {
            if (!prev) return prev;
            const maxX = Math.max(0, viewportSize.width - panelSize.width);
            const maxY = Math.max(0, viewportSize.height - panelSize.height);
            const next = {
                x: Math.min(Math.max(prev.x, 0), maxX),
                y: Math.min(Math.max(prev.y, 0), maxY),
            };
            if (next.x === prev.x && next.y === prev.y) {
                return prev;
            }
            return next;
        });
    }, [
        isDesktop,
        panelSize.height,
        panelSize.width,
        viewportSize.height,
        viewportSize.width,
    ]);

    useEffect(() => {
        hasLoadedPersistedPanelRef.current = false;
    }, [panelStorageKey]);

    useEffect(() => {
        if (!isDesktop || hasLoadedPersistedPanelRef.current) return;
        hasLoadedPersistedPanelRef.current = true;

        let parsed: PersistedPanelState | null = null;
        try {
            const raw = window.localStorage.getItem(panelStorageKey);
            if (raw) {
                const candidate = JSON.parse(
                    raw,
                ) as Partial<PersistedPanelState>;
                const isValid =
                    typeof candidate.x === "number" &&
                    Number.isFinite(candidate.x) &&
                    typeof candidate.y === "number" &&
                    Number.isFinite(candidate.y) &&
                    typeof candidate.width === "number" &&
                    Number.isFinite(candidate.width) &&
                    typeof candidate.height === "number" &&
                    Number.isFinite(candidate.height);
                if (isValid) {
                    parsed = candidate as PersistedPanelState;
                }
            }
        } catch {
            parsed = null;
        }

        if (!parsed) return;
        const maxWidth = getDesktopMaxWidth(viewportSize.width);
        const maxHeight = getDesktopMaxHeight(viewportSize.height);
        const width = clamp(parsed.width, DESKTOP_PANEL_MIN_WIDTH, maxWidth);
        const height = clamp(
            parsed.height,
            DESKTOP_PANEL_MIN_HEIGHT,
            maxHeight,
        );
        const maxX = Math.max(0, viewportSize.width - width);
        const maxY = Math.max(0, viewportSize.height - height);

        setPanelSize({ width, height });
        setPanelPosition({
            x: clamp(parsed.x, 0, maxX),
            y: clamp(parsed.y, 0, maxY),
        });
    }, [isDesktop, panelStorageKey, viewportSize.height, viewportSize.width]);

    useEffect(() => {
        if (!isDesktop || !panelPosition) return;
        try {
            const payload: PersistedPanelState = {
                x: Math.round(panelPosition.x),
                y: Math.round(panelPosition.y),
                width: Math.round(panelSize.width),
                height: Math.round(panelSize.height),
            };
            window.localStorage.setItem(
                panelStorageKey,
                JSON.stringify(payload),
            );
        } catch {
            // no-op: localStorage unavailable/blocked
        }
    }, [
        isDesktop,
        panelPosition,
        panelSize.height,
        panelSize.width,
        panelStorageKey,
    ]);

    const handleSubmit = useCallback(
        async (e?: React.FormEvent) => {
            e?.preventDefault();
            const trimmed = input.trim();
            if (!trimmed || sendingRef.current) return;

            sendingRef.current = true;
            setStage("chat");
            setSendingState(true);
            setOptimisticPrompt(trimmed);
            setInput("");
            resizeComposer(inputRef.current);
            resizeComposer(chatInputRef.current);
            clearSettleTimer();
            settleTimerRef.current = window.setTimeout(() => {
                setSendingState(false);
            }, 30000);

            try {
                const result = await startChat({
                    clientId,
                    threadId: threadId ?? undefined,
                    prompt: trimmed,
                });
                if (!threadId) {
                    setThreadId(result.threadId);
                }
            } catch {
                setSendingState(false);
                setOptimisticPrompt(null);
                toast.error("Failed to send question");
            } finally {
                sendingRef.current = false;
            }
        },
        [
            clearSettleTimer,
            clientId,
            input,
            resizeComposer,
            startChat,
            threadId,
        ],
    );

    const handleNewChat = useCallback(() => {
        setThreadId(null);
        setInput("");
        setOptimisticPrompt(null);
        setSendingState(false);
        clearSettleTimer();
    }, [clearSettleTimer]);

    const handleSelectThread = useCallback(
        (agentThreadId: string) => {
            setThreadId(agentThreadId);
            setOptimisticPrompt(null);
            setSendingState(false);
            clearSettleTimer();
            setStage("chat");
        },
        [clearSettleTimer],
    );

    const handleSyncState = useCallback(
        ({ hasAssistantActivity, optimisticMatched }: ChatSyncState) => {
            if (optimisticMatched) {
                setOptimisticPrompt(null);
            }
            if (sendingState && hasAssistantActivity) {
                setSendingState(false);
                clearSettleTimer();
            }
        },
        [clearSettleTimer, sendingState],
    );

    const handleComposerKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSubmit();
            }
        },
        [handleSubmit],
    );

    const openChatPanel = useCallback(() => {
        setStage("chat");
    }, []);

    const renderOverlayLayer = useCallback((children: React.ReactNode) => {
        if (typeof document === "undefined") return null;
        return createPortal(children, document.body);
    }, []);

    // --- Stage: closed --- FAB button
    if (stage === "closed") {
        return (
            <button
                onClick={openChatPanel}
                className="fixed bottom-6 right-6 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
                <Bot className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex items-center gap-0.5 rounded-md border bg-muted px-1 py-0.5 text-[9px] font-medium text-muted-foreground shadow-sm">
                    <Command className="h-2 w-2" />K
                </span>
            </button>
        );
    }

    // --- Stage: input --- Floating input bar
    if (stage === "input") {
        return renderOverlayLayer(
            <>
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setStage("closed")}
                />
                <div className="fixed bottom-8 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 px-3 sm:px-0">
                    <form
                        onSubmit={handleSubmit}
                        className="force-light flex items-center gap-2 rounded-2xl border bg-background/95 px-4 py-3 shadow-2xl backdrop-blur"
                        style={tenantDialogStyle}
                    >
                        <Bot className="h-5 w-5 shrink-0 text-primary" />
                        <Textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onInput={(e) => resizeComposer(e.currentTarget)}
                            onKeyDown={handleComposerKeyDown}
                            rows={1}
                            placeholder="Ask about your documents..."
                            className="min-h-10 max-h-32 flex-1 resize-none border-none bg-transparent py-2.5 shadow-none focus-visible:ring-0"
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
                        <kbd className="hidden items-center rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline-flex">
                            Esc
                        </kbd>
                    </form>
                </div>
            </>,
        );
    }

    // --- Stage: chat --- Floating panel
    const desktopMaxWidth = getDesktopMaxWidth(viewportSize.width);
    const desktopMaxHeight = getDesktopMaxHeight(viewportSize.height);
    const desktopMinWidth = Math.min(
        sessionsOpen
            ? DESKTOP_PANEL_WIDTH_WITH_SESSIONS
            : DESKTOP_PANEL_MIN_WIDTH,
        desktopMaxWidth,
    );
    const desktopMinHeight = Math.min(
        DESKTOP_PANEL_MIN_HEIGHT,
        desktopMaxHeight,
    );
    const desktopWidth = clamp(
        panelSize.width,
        desktopMinWidth,
        desktopMaxWidth,
    );
    const desktopHeight = clamp(
        panelSize.height,
        desktopMinHeight,
        desktopMaxHeight,
    );
    const desktopDragMaxX = Math.max(0, viewportSize.width - desktopWidth);
    const desktopDragMaxY = Math.max(0, viewportSize.height - desktopHeight);
    const desktopPanelPosition = panelPosition ?? {
        x: Math.max(
            0,
            viewportSize.width - desktopWidth - DESKTOP_PANEL_MARGIN,
        ),
        y: Math.max(
            0,
            viewportSize.height - desktopHeight - DESKTOP_PANEL_MARGIN,
        ),
    };

    const panelContent = (
        <div
            className="force-light flex h-full w-full flex-col rounded-2xl border bg-background/95 shadow-2xl backdrop-blur"
            style={tenantDialogStyle}
        >
            <div
                className={cn(
                    "flex items-center justify-between border-b px-4 py-3",
                    isDesktop && "kb-chat-drag-handle cursor-move select-none",
                )}
            >
                <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                        {ASSISTANT_NAME}
                    </span>
                </div>
                <div className="kb-chat-no-drag flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 px-2 text-xs"
                        onClick={() => setSessionsOpen((prev) => !prev)}
                    >
                        <Clock className="h-3.5 w-3.5" />
                        Sessions
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleNewChat}
                        title="New chat"
                    >
                        <Plus className="h-3.5 w-3.5" />
                    </Button>
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

            <div className="flex min-h-0 flex-1">
                {sessionsOpen && (
                    <ThreadHistoryPanel
                        clientId={clientId}
                        activeThreadId={threadId}
                        onSelectThread={handleSelectThread}
                        onNewChat={handleNewChat}
                        dialogStyle={tenantDialogStyle}
                    />
                )}

                <div className="flex min-w-0 flex-1 flex-col">
                    {threadId ? (
                        <ChatMessages
                            threadId={threadId}
                            sendingState={sendingState}
                            optimisticPrompt={optimisticPrompt}
                            onSyncState={handleSyncState}
                        />
                    ) : (
                        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
                            {optimisticPrompt ? (
                                <>
                                    <UserBubble
                                        text={optimisticPrompt}
                                        optimistic
                                    />
                                    {sendingState && <ThinkingBubble />}
                                </>
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center text-center">
                                    <Bot className="mb-2 h-8 w-8 text-muted-foreground/50" />
                                    <p className="text-xs text-muted-foreground">
                                        Ask a question about your documents
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="flex items-end gap-2 border-t px-3 py-2"
                    >
                        <Textarea
                            ref={chatInputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onInput={(e) => resizeComposer(e.currentTarget)}
                            onKeyDown={handleComposerKeyDown}
                            rows={1}
                            placeholder="Ask a question..."
                            disabled={sendingState}
                            className="min-h-10 max-h-32 flex-1 resize-none py-2.5 text-sm"
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
            </div>
        </div>
    );

    return renderOverlayLayer(
        <>
            <div
                className="fixed inset-0 z-40"
                onClick={() => setStage("closed")}
            />
            {isDesktop ? (
                <Rnd
                    size={{ width: desktopWidth, height: desktopHeight }}
                    position={{
                        x: clamp(desktopPanelPosition.x, 0, desktopDragMaxX),
                        y: clamp(desktopPanelPosition.y, 0, desktopDragMaxY),
                    }}
                    minWidth={desktopMinWidth}
                    minHeight={desktopMinHeight}
                    maxWidth={desktopMaxWidth}
                    maxHeight={desktopMaxHeight}
                    bounds="window"
                    dragHandleClassName="kb-chat-drag-handle"
                    cancel=".kb-chat-no-drag"
                    style={{ position: "fixed" }}
                    className="z-50"
                    onDragStop={(_, data) => {
                        setPanelPosition({
                            x: clamp(data.x, 0, desktopDragMaxX),
                            y: clamp(data.y, 0, desktopDragMaxY),
                        });
                    }}
                    onResizeStop={(_, __, ref, ___, position) => {
                        const nextSize = {
                            width: clamp(
                                ref.offsetWidth,
                                desktopMinWidth,
                                desktopMaxWidth,
                            ),
                            height: clamp(
                                ref.offsetHeight,
                                desktopMinHeight,
                                desktopMaxHeight,
                            ),
                        };
                        const maxX = Math.max(
                            0,
                            viewportSize.width - nextSize.width,
                        );
                        const maxY = Math.max(
                            0,
                            viewportSize.height - nextSize.height,
                        );
                        setPanelSize(nextSize);
                        setPanelPosition({
                            x: clamp(position.x, 0, maxX),
                            y: clamp(position.y, 0, maxY),
                        });
                    }}
                >
                    <div
                        className="h-full w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {panelContent}
                    </div>
                </Rnd>
            ) : (
                <div
                    className="fixed bottom-3 right-3 z-50 h-[520px] w-[calc(100vw-1.5rem)]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {panelContent}
                </div>
            )}
        </>,
    );
}
