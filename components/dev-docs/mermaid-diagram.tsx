"use client";

import { useEffect, useId, useState } from "react";

interface MermaidDiagramProps {
    chart: string;
    theme?: "dark" | "light";
}

export function MermaidDiagram({ chart, theme = "dark" }: MermaidDiagramProps) {
    const reactId = useId();
    const [svg, setSvg] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const isDark = theme === "dark";

    useEffect(() => {
        let cancelled = false;

        async function renderDiagram() {
            try {
                const mermaid = (await import("mermaid")).default;
                mermaid.initialize({
                    startOnLoad: false,
                    securityLevel: "loose",
                    theme: isDark ? "dark" : "neutral",
                    fontFamily: "'uncut sans', sans-serif",
                });

                const diagramId = `mermaid-${reactId.replace(/[:]/g, "-")}`;
                const { svg: renderedSvg } = await mermaid.render(diagramId, chart);

                if (!cancelled) {
                    setSvg(renderedSvg);
                    setError(null);
                }
            } catch (renderError) {
                if (!cancelled) {
                    const message =
                        renderError instanceof Error
                            ? renderError.message
                            : "Unable to render Mermaid diagram.";
                    setError(message);
                    setSvg("");
                }
            }
        }

        renderDiagram();

        return () => {
            cancelled = true;
        };
    }, [chart, isDark, reactId]);

    if (error) {
        return (
            <div className={`rounded-[1.5rem] border p-4 text-sm ${isDark ? "border-rose-400/50 bg-rose-950/30 text-rose-200" : "border-rose-300 bg-rose-50 text-rose-800"}`}>
                <p className="font-semibold">Mermaid render failed</p>
                <p className="mt-2 whitespace-pre-wrap break-words">{error}</p>
            </div>
        );
    }

    if (!svg) {
        return (
            <div className={`rounded-[1.5rem] border p-6 text-sm ${isDark ? "border-white/10 bg-white/5 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                Rendering diagram...
            </div>
        );
    }

    return (
        <div className={`overflow-x-auto rounded-[1.5rem] border p-4 shadow-[0_20px_60px_rgba(15,23,42,0.18)] ${isDark ? "border-white/10 bg-[#0f1724]" : "border-slate-200 bg-white"}`}>
            <div
                className="min-w-max [&_svg]:h-auto [&_svg]:max-w-full"
                dangerouslySetInnerHTML={{ __html: svg }}
            />
        </div>
    );
}
