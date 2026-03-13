"use client";

import { useMemo, useState } from "react";
import { MoonStar, SunMedium, FileText, Layers3 } from "lucide-react";
import type { DevDocFile } from "@/lib/dev-docs";
import { MarkdownRenderer } from "./markdown-renderer";

interface DevDocsViewerProps {
    docs: DevDocFile[];
}

type ThemeMode = "dark" | "light";

export function DevDocsViewer({ docs }: DevDocsViewerProps) {
    const [theme, setTheme] = useState<ThemeMode>("dark");
    const [activeDocSlug, setActiveDocSlug] = useState(docs[0]?.slug ?? "");
    const activeDoc = useMemo(
        () => docs.find((doc) => doc.slug === activeDocSlug) ?? docs[0],
        [activeDocSlug, docs],
    );
    const [activeSectionSlug, setActiveSectionSlug] = useState(
        activeDoc?.sections[0]?.slug ?? "",
    );

    const sectionOptions = activeDoc?.sections ?? [];
    const activeSection =
        sectionOptions.find((section) => section.slug === activeSectionSlug) ??
        sectionOptions[0];

    function handleDocChange(slug: string) {
        const nextDoc = docs.find((doc) => doc.slug === slug);
        setActiveDocSlug(slug);
        setActiveSectionSlug(nextDoc?.sections[0]?.slug ?? "");
    }

    if (docs.length === 0) {
        return (
            <div className="min-h-screen bg-[#0d1117] px-4 py-10 text-slate-200">
                <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl">
                    No markdown files found in `docs/architecture`.
                </div>
            </div>
        );
    }

    const isDark = theme === "dark";
    const shellBg = isDark
        ? "bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.22),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.14),_transparent_24%),linear-gradient(180deg,#07111d_0%,#0b1320_55%,#101828_100%)] text-slate-100"
        : "bg-[radial-gradient(circle_at_top_left,_rgba(13,148,136,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(217,119,6,0.12),_transparent_24%),linear-gradient(180deg,#f8fafc_0%,#f6efe4_55%,#efe7db_100%)] text-slate-900";
    const panelClass = isDark
        ? "border-white/10 bg-[#08111dcc]"
        : "border-slate-300 bg-white/85";
    const panelTextMuted = isDark ? "text-slate-300" : "text-slate-600";
    const eyebrowClass = isDark ? "text-teal-300/80" : "text-teal-700";
    const headlineClass = isDark ? "text-white" : "text-slate-900";
    const dividerClass = isDark ? "border-white/10" : "border-slate-200";

    return (
        <div className={isDark ? "dark" : ""}>
            <div className={`min-h-screen ${shellBg}`}>
                <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 py-6 md:px-6 lg:px-10">
                    <header className={`mb-6 rounded-[2rem] border px-6 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl ${panelClass}`}>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <p className={`text-xs font-semibold uppercase tracking-[0.32em] ${eyebrowClass}`}>
                                    Developer Docs
                                </p>
                                <h1 className={`mt-2 max-w-4xl text-3xl font-semibold tracking-[-0.05em] md:text-4xl ${headlineClass}`}>
                                    Chunked architecture flows with document tabs and section subtabs
                                </h1>
                                <p className={`mt-3 max-w-2xl text-sm ${panelTextMuted}`}>
                                    Primary tabs switch feature documents. Secondary tabs jump between `##` chunked flows inside the selected document.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setTheme(isDark ? "light" : "dark")}
                                className={`inline-flex items-center gap-2 self-start rounded-full border px-4 py-2 text-sm font-medium transition ${
                                    isDark
                                        ? "border-white/10 bg-white/8 text-slate-100 hover:bg-white/14"
                                        : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                                }`}
                            >
                                {isDark ? (
                                    <>
                                        <SunMedium className="h-4 w-4" />
                                        Light mode
                                    </>
                                ) : (
                                    <>
                                        <MoonStar className="h-4 w-4" />
                                        Dark mode
                                    </>
                                )}
                            </button>
                        </div>
                    </header>

                    <div className={`rounded-[2rem] border p-4 shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl ${panelClass}`}>
                        <div className={`flex items-center gap-2 px-2 pb-3 text-xs font-semibold uppercase tracking-[0.24em] ${panelTextMuted}`}>
                            <FileText className="h-4 w-4" />
                            Main Tabs
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-1">
                            {docs.map((doc) => {
                                const isActive = doc.slug === activeDoc?.slug;
                                return (
                                    <button
                                        key={doc.slug}
                                        type="button"
                                        onClick={() => handleDocChange(doc.slug)}
                                        className={`rounded-[1.35rem] border px-4 py-3 text-left transition ${
                                            isActive
                                                ? isDark
                                                    ? "border-teal-400/40 bg-teal-300/10 text-white shadow-[0_14px_40px_rgba(45,212,191,0.15)]"
                                                    : "border-teal-600/30 bg-teal-50 text-slate-900 shadow-[0_14px_40px_rgba(13,148,136,0.10)]"
                                                : isDark
                                                  ? "border-white/8 bg-white/5 text-slate-300 hover:bg-white/10"
                                                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white"
                                        }`}
                                    >
                                        <div className="text-sm font-semibold tracking-[-0.02em]">
                                            {doc.title}
                                        </div>
                                        <div className="mt-1 text-xs uppercase tracking-[0.16em] text-current/60">
                                            {doc.filename}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-6 grid flex-1 gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
                        <aside className={`rounded-[2rem] border p-4 shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl ${panelClass}`}>
                            <div className={`flex items-center gap-2 px-2 pb-4 text-xs font-semibold uppercase tracking-[0.24em] ${panelTextMuted}`}>
                                <Layers3 className="h-4 w-4" />
                                Subtabs
                            </div>

                            <div className="space-y-2">
                                {sectionOptions.map((section, index) => {
                                    const isActive = section.slug === activeSection?.slug;
                                    return (
                                        <button
                                            key={`${activeDoc?.slug}-${section.slug}`}
                                            type="button"
                                            onClick={() => setActiveSectionSlug(section.slug)}
                                            className={`block w-full rounded-[1.2rem] border px-4 py-3 text-left transition ${
                                                isActive
                                                    ? isDark
                                                        ? "border-amber-400/35 bg-amber-300/10 text-white shadow-[0_14px_30px_rgba(245,158,11,0.12)]"
                                                        : "border-amber-600/25 bg-amber-50 text-slate-900 shadow-[0_14px_30px_rgba(217,119,6,0.10)]"
                                                    : isDark
                                                      ? "border-white/8 bg-white/5 text-slate-300 hover:bg-white/10"
                                                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white"
                                            }`}
                                        >
                                            <div className="text-[11px] uppercase tracking-[0.22em] text-current/55">
                                                {String(index + 1).padStart(2, "0")}
                                            </div>
                                            <div className="mt-1 text-sm font-semibold tracking-[-0.02em]">
                                                {section.title}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </aside>

                        <main className={`rounded-[2rem] border p-5 shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl md:p-8 lg:p-10 ${panelClass}`}>
                            {activeDoc && activeSection ? (
                                <>
                                    <div className={`mb-8 flex flex-col gap-3 border-b pb-6 ${dividerClass}`}>
                                        <div className={`text-xs font-semibold uppercase tracking-[0.24em] ${eyebrowClass}`}>
                                            {activeDoc.title}
                                        </div>
                                        <h2 className={`text-2xl font-semibold tracking-[-0.04em] md:text-3xl ${headlineClass}`}>
                                            {activeSection.title}
                                        </h2>
                                    </div>
                                    <MarkdownRenderer content={activeSection.content} theme={theme} />
                                </>
                            ) : (
                                <div className={`flex min-h-[40vh] items-center justify-center rounded-[1.5rem] border border-dashed ${isDark ? "border-white/12 bg-white/5 text-slate-300" : "border-slate-300 bg-slate-50 text-slate-600"}`}>
                                    Select a document section.
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </div>
        </div>
    );
}
