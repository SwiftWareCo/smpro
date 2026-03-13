"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MermaidDiagram } from "./mermaid-diagram";

interface MarkdownRendererProps {
    content: string;
    theme?: "dark" | "light";
}

export function MarkdownRenderer({ content, theme = "dark" }: MarkdownRendererProps) {
    const isDark = theme === "dark";

    return (
        <div
            className={`docs-markdown text-[0.98rem] leading-7 ${
                isDark ? "text-slate-200" : "text-slate-800"
            }`}
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => (
                        <h1 className={`mt-2 text-4xl font-semibold tracking-[-0.04em] first:mt-0 ${isDark ? "text-white" : "text-slate-900"}`}>
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className={`mt-12 border-t pt-8 text-2xl font-semibold tracking-[-0.03em] first:mt-0 first:border-t-0 first:pt-0 ${isDark ? "border-white/10 text-white" : "border-slate-200 text-slate-900"}`}>
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className={`mt-8 text-xl font-semibold tracking-[-0.02em] ${isDark ? "text-white" : "text-slate-900"}`}>
                            {children}
                        </h3>
                    ),
                    p: ({ children }) => (
                        <p className={`mt-4 ${isDark ? "text-slate-300" : "text-slate-700"}`}>{children}</p>
                    ),
                    ul: ({ children }) => (
                        <ul className={`mt-4 list-disc space-y-2 pl-6 ${isDark ? "marker:text-teal-300" : "marker:text-amber-700"}`}>
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className={`mt-4 list-decimal space-y-2 pl-6 ${isDark ? "marker:text-teal-300" : "marker:text-amber-700"}`}>
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => <li className="pl-1">{children}</li>,
                    blockquote: ({ children }) => (
                        <blockquote className={`mt-6 rounded-r-[1.25rem] border-l-4 px-5 py-4 italic ${isDark ? "border-teal-300 bg-white/5 text-slate-300" : "border-amber-600 bg-amber-50 text-slate-700"}`}>
                            {children}
                        </blockquote>
                    ),
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            className={`font-medium underline underline-offset-4 ${isDark ? "text-teal-300 decoration-teal-300/35 hover:decoration-teal-300" : "text-amber-800 decoration-amber-700/35 hover:decoration-amber-700"}`}
                        >
                            {children}
                        </a>
                    ),
                    hr: () => (
                        <hr className={`my-10 ${isDark ? "border-white/10" : "border-slate-200"}`} />
                    ),
                    table: ({ children }) => (
                        <div className={`mt-6 overflow-x-auto rounded-[1.25rem] border ${isDark ? "border-white/10 bg-[#0f1724]" : "border-slate-200 bg-white"}`}>
                            <table className="min-w-full border-collapse text-left text-sm">
                                {children}
                            </table>
                        </div>
                    ),
                    th: ({ children }) => (
                        <th className={`border-b px-4 py-3 font-semibold ${isDark ? "border-white/10 bg-white/5 text-white" : "border-slate-200 bg-slate-50 text-slate-900"}`}>
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className={`border-b px-4 py-3 align-top last:border-b-0 ${isDark ? "border-white/10 text-slate-300" : "border-slate-200 text-slate-700"}`}>
                            {children}
                        </td>
                    ),
                    code(props) {
                        const { className, children } = props;
                        const match = /language-(\w+)/.exec(className || "");
                        const code = String(children).replace(/\n$/, "");

                        if (match?.[1] === "mermaid") {
                            return <MermaidDiagram chart={code} theme={theme} />;
                        }

                        const isInline = !className;
                        if (isInline) {
                            return (
                                <code className={`rounded-md px-1.5 py-0.5 font-mono text-[0.9em] ${isDark ? "bg-white/10 text-slate-100" : "bg-slate-100 text-slate-900"}`}>
                                    {children}
                                </code>
                            );
                        }

                        return (
                            <code className={`block overflow-x-auto rounded-[1.5rem] px-5 py-4 font-mono text-sm leading-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${isDark ? "bg-[#111827] text-slate-100" : "bg-[#f8fafc] text-slate-900 ring-1 ring-slate-200"}`}>
                                {code}
                            </code>
                        );
                    },
                    pre: ({ children }) => <div className="mt-6">{children}</div>,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
