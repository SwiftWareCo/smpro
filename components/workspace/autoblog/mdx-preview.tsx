"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
    Info,
    AlertTriangle,
    CheckCircle,
    Lightbulb,
    TrendingUp,
    TrendingDown,
    Minus,
    Quote as QuoteIcon,
} from "lucide-react";

interface MDXPreviewProps {
    content: string;
}

export function MDXPreview({ content }: MDXPreviewProps) {
    const { frontmatter, body } = useMemo(() => parseMDX(content), [content]);

    return (
        <div className="prose prose-sm dark:prose-invert max-w-none">
            {/* Frontmatter Preview */}
            {frontmatter.title && (
                <div className="not-prose mb-8 pb-6 border-b">
                    <h1 className="text-2xl font-bold mb-2">
                        {frontmatter.title}
                    </h1>
                    {frontmatter.excerpt && (
                        <p className="text-muted-foreground mb-4">
                            {frontmatter.excerpt}
                        </p>
                    )}
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        {frontmatter.author && (
                            <span>By {frontmatter.author}</span>
                        )}
                        {frontmatter.publishedAt && (
                            <span>
                                {new Date(
                                    frontmatter.publishedAt,
                                ).toLocaleDateString()}
                            </span>
                        )}
                        {frontmatter.readingTime && (
                            <span>{frontmatter.readingTime} min read</span>
                        )}
                    </div>
                    {frontmatter.tags && frontmatter.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                            {frontmatter.tags.map((tag, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-0.5 bg-muted rounded-full text-xs"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Content Preview */}
            <MDXContent content={body} />
        </div>
    );
}

interface Frontmatter {
    title?: string;
    excerpt?: string;
    author?: string;
    publishedAt?: string;
    readingTime?: number;
    tags?: string[];
    featuredImage?: string;
}

const FALLBACK_IMAGE_SRC =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='675' viewBox='0 0 1200 675'%3E%3Crect width='1200' height='675' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-family='sans-serif' font-size='36'%3EImage%20Not%20Found%3C/text%3E%3C/svg%3E";

function parseMDX(content: string): { frontmatter: Frontmatter; body: string } {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

    if (!frontmatterMatch) {
        return { frontmatter: {}, body: content };
    }

    const frontmatterStr = frontmatterMatch[1];
    const body = content.slice(frontmatterMatch[0].length).trim();

    const frontmatter: Frontmatter = {};

    // Simple YAML parsing
    const lines = frontmatterStr.split("\n");
    let currentKey: string | null = null;
    let arrayValues: string[] = [];

    for (const line of lines) {
        const trimmed = line.trim();

        // Array item
        if (trimmed.startsWith("- ") && currentKey) {
            const value = trimmed.slice(2).replace(/^["']|["']$/g, "");
            arrayValues.push(value);
            continue;
        }

        // Save previous array if we're moving to a new key
        if (currentKey && arrayValues.length > 0) {
            (frontmatter as any)[currentKey] = arrayValues;
            arrayValues = [];
        }

        // Key-value pair
        const match = trimmed.match(/^(\w+):\s*(.*)$/);
        if (match) {
            const [, key, value] = match;
            currentKey = key;

            if (value) {
                // Direct value
                const cleanValue = value.replace(/^["']|["']$/g, "");
                if (key === "readingTime") {
                    frontmatter.readingTime = parseInt(cleanValue, 10);
                } else {
                    (frontmatter as any)[key] = cleanValue;
                }
                currentKey = null;
            }
        }
    }

    // Save final array
    if (currentKey && arrayValues.length > 0) {
        (frontmatter as any)[currentKey] = arrayValues;
    }

    return { frontmatter, body };
}

function MDXContent({ content }: { content: string }) {
    const elements = useMemo(() => parseContent(content), [content]);

    return (
        <div className="space-y-4">
            {elements.map((el, i) => (
                <ContentElement key={i} element={el} />
            ))}
        </div>
    );
}

type ParsedElement =
    | { type: "paragraph"; content: string }
    | { type: "heading"; level: number; content: string }
    | { type: "callout"; calloutType: string; title?: string; content: string }
    | {
          type: "statcard";
          value: string;
          label: string;
          trend?: string;
          trendDirection?: string;
      }
    | { type: "quote"; author: string; role?: string; content: string }
    | { type: "stepguide"; steps: { title: string; content: string }[] }
    | {
          type: "imagewithcaption";
          src: string;
          alt: string;
          caption?: string;
          credit?: string;
      }
    | {
          type: "chart";
          chartType: string;
          title?: string;
          data: { label: string; value: number }[];
      }
    | { type: "code"; language?: string; content: string }
    | { type: "list"; ordered: boolean; items: string[] };

function parseContent(content: string): ParsedElement[] {
    const elements: ParsedElement[] = [];
    const lines = content.split("\n");
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        // Skip empty lines
        if (!trimmed) {
            i++;
            continue;
        }

        // Heading
        const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            elements.push({
                type: "heading",
                level: headingMatch[1].length,
                content: headingMatch[2],
            });
            i++;
            continue;
        }

        // Code block
        if (trimmed.startsWith("```")) {
            const language = trimmed.slice(3).trim();
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].trim().startsWith("```")) {
                codeLines.push(lines[i]);
                i++;
            }
            elements.push({
                type: "code",
                language: language || undefined,
                content: codeLines.join("\n"),
            });
            i++;
            continue;
        }

        // JSX Component - Callout
        if (trimmed.startsWith("<Callout")) {
            const { element, endIndex } = parseCallout(lines, i);
            if (element) elements.push(element);
            i = endIndex + 1;
            continue;
        }

        // JSX Component - StatCard
        if (trimmed.startsWith("<StatCard")) {
            const element = parseStatCard(trimmed);
            if (element) elements.push(element);
            i++;
            continue;
        }

        // JSX Component - Quote
        if (trimmed.startsWith("<Quote")) {
            const { element, endIndex } = parseQuote(lines, i);
            if (element) elements.push(element);
            i = endIndex + 1;
            continue;
        }

        // JSX Component - StepGuide
        if (trimmed.startsWith("<StepGuide")) {
            const { element, endIndex } = parseStepGuide(lines, i);
            if (element) elements.push(element);
            i = endIndex + 1;
            continue;
        }

        // JSX Component - ImageWithCaption
        if (trimmed.startsWith("<ImageWithCaption")) {
            const element = parseImageWithCaption(trimmed);
            if (element) elements.push(element);
            i++;
            continue;
        }

        // JSX Component - Chart
        if (trimmed.startsWith("<Chart")) {
            const { element, endIndex } = parseChart(lines, i);
            if (element) elements.push(element);
            i = endIndex + 1;
            continue;
        }

        // List (ordered or unordered)
        if (trimmed.match(/^[-*]\s/) || trimmed.match(/^\d+\.\s/)) {
            const ordered = /^\d+\./.test(trimmed);
            const items: string[] = [];
            while (i < lines.length) {
                const listLine = lines[i].trim();
                const itemMatch = ordered
                    ? listLine.match(/^\d+\.\s+(.+)$/)
                    : listLine.match(/^[-*]\s+(.+)$/);
                if (!itemMatch) break;
                items.push(itemMatch[1]);
                i++;
            }
            elements.push({ type: "list", ordered, items });
            continue;
        }

        // Default: paragraph
        const paragraphLines: string[] = [trimmed];
        i++;
        while (
            i < lines.length &&
            lines[i].trim() &&
            !lines[i].trim().startsWith("#") &&
            !lines[i].trim().startsWith("<") &&
            !lines[i].trim().startsWith("```") &&
            !lines[i].trim().match(/^[-*]\s/) &&
            !lines[i].trim().match(/^\d+\.\s/)
        ) {
            paragraphLines.push(lines[i].trim());
            i++;
        }
        elements.push({
            type: "paragraph",
            content: paragraphLines.join(" "),
        });
    }

    return elements;
}

function parseCallout(
    lines: string[],
    startIndex: number,
): { element: ParsedElement | null; endIndex: number } {
    const firstLine = lines[startIndex];
    const typeMatch = firstLine.match(/type=["'](\w+)["']/);
    const titleMatch = firstLine.match(/title=["']([^"']+)["']/);

    // Find content and closing tag
    let content = "";
    let endIndex = startIndex;

    if (firstLine.includes("/>")) {
        // Self-closing
        return { element: null, endIndex: startIndex };
    }

    // Find closing </Callout>
    const contentStart = firstLine.indexOf(">") + 1;
    if (contentStart > 0 && firstLine.includes("</Callout>")) {
        content = firstLine
            .slice(contentStart, firstLine.indexOf("</Callout>"))
            .trim();
    } else {
        const contentLines: string[] = [];
        if (contentStart > 0) {
            contentLines.push(firstLine.slice(contentStart));
        }
        endIndex++;
        while (
            endIndex < lines.length &&
            !lines[endIndex].includes("</Callout>")
        ) {
            contentLines.push(lines[endIndex]);
            endIndex++;
        }
        if (endIndex < lines.length) {
            const lastContent = lines[endIndex]
                .replace("</Callout>", "")
                .trim();
            if (lastContent) contentLines.push(lastContent);
        }
        content = contentLines.join(" ").trim();
    }

    return {
        element: {
            type: "callout",
            calloutType: typeMatch?.[1] || "info",
            title: titleMatch?.[1],
            content,
        },
        endIndex,
    };
}

function parseStatCard(line: string): ParsedElement | null {
    const valueMatch = line.match(/value=["']([^"']+)["']/);
    const labelMatch = line.match(/label=["']([^"']+)["']/);
    const trendMatch = line.match(/trend=["']([^"']+)["']/);
    const directionMatch = line.match(/trendDirection=["'](\w+)["']/);

    if (!valueMatch || !labelMatch) return null;

    return {
        type: "statcard",
        value: valueMatch[1],
        label: labelMatch[1],
        trend: trendMatch?.[1],
        trendDirection: directionMatch?.[1],
    };
}

function parseQuote(
    lines: string[],
    startIndex: number,
): { element: ParsedElement | null; endIndex: number } {
    const firstLine = lines[startIndex];
    const authorMatch = firstLine.match(/author=["']([^"']+)["']/);
    const roleMatch = firstLine.match(/role=["']([^"']+)["']/);

    if (!authorMatch) {
        return { element: null, endIndex: startIndex };
    }

    // Find content
    let content = "";
    let endIndex = startIndex;

    const contentStart = firstLine.indexOf(">") + 1;
    if (contentStart > 0 && firstLine.includes("</Quote>")) {
        content = firstLine
            .slice(contentStart, firstLine.indexOf("</Quote>"))
            .trim();
    } else {
        const contentLines: string[] = [];
        if (contentStart > 0) {
            contentLines.push(firstLine.slice(contentStart));
        }
        endIndex++;
        while (
            endIndex < lines.length &&
            !lines[endIndex].includes("</Quote>")
        ) {
            contentLines.push(lines[endIndex]);
            endIndex++;
        }
        content = contentLines.join(" ").trim();
    }

    return {
        element: {
            type: "quote",
            author: authorMatch[1],
            role: roleMatch?.[1],
            content,
        },
        endIndex,
    };
}

function parseStepGuide(
    lines: string[],
    startIndex: number,
): { element: ParsedElement | null; endIndex: number } {
    // This is a simplified parser - assumes steps are in the same line or multiline
    let fullContent = lines[startIndex];
    let endIndex = startIndex;

    if (!fullContent.includes("/>")) {
        endIndex++;
        while (endIndex < lines.length && !lines[endIndex].includes("/>")) {
            fullContent += " " + lines[endIndex];
            endIndex++;
        }
        if (endIndex < lines.length) {
            fullContent += " " + lines[endIndex];
        }
    }

    // Try to extract steps array
    const stepsMatch = fullContent.match(/steps=\{(\[[\s\S]*?\])\}/);
    if (!stepsMatch) {
        return { element: null, endIndex };
    }

    try {
        // Simple JSON-like parsing (won't work for all cases)
        const stepsStr = stepsMatch[1]
            .replace(/(\w+):/g, '"$1":')
            .replace(/'/g, '"');
        const steps = JSON.parse(stepsStr);
        return {
            element: { type: "stepguide", steps },
            endIndex,
        };
    } catch {
        return { element: null, endIndex };
    }
}

function parseImageWithCaption(line: string): ParsedElement | null {
    const srcMatch = line.match(/src=["']([^"']+)["']/);
    const altMatch = line.match(/alt=["']([^"']+)["']/);
    const captionMatch = line.match(/caption=["']([^"']+)["']/);
    const creditMatch = line.match(/credit=["']([^"']+)["']/);

    if (!srcMatch || !altMatch) return null;

    return {
        type: "imagewithcaption",
        src: srcMatch[1],
        alt: altMatch[1],
        caption: captionMatch?.[1],
        credit: creditMatch?.[1],
    };
}

function parseChart(
    lines: string[],
    startIndex: number,
): { element: ParsedElement | null; endIndex: number } {
    let fullContent = lines[startIndex];
    let endIndex = startIndex;

    if (!fullContent.includes("/>")) {
        endIndex++;
        while (endIndex < lines.length && !lines[endIndex].includes("/>")) {
            fullContent += " " + lines[endIndex];
            endIndex++;
        }
        if (endIndex < lines.length) {
            fullContent += " " + lines[endIndex];
        }
    }

    const typeMatch = fullContent.match(/type=["'](\w+)["']/);
    const titleMatch = fullContent.match(/title=["']([^"']+)["']/);
    const dataMatch = fullContent.match(/data=\{(\[[\s\S]*?\])\}/);

    if (!typeMatch) {
        return { element: null, endIndex };
    }

    let data: { label: string; value: number }[] = [];
    if (dataMatch) {
        try {
            const dataStr = dataMatch[1]
                .replace(/(\w+):/g, '"$1":')
                .replace(/'/g, '"');
            data = JSON.parse(dataStr);
        } catch {
            // Ignore parse errors
        }
    }

    return {
        element: {
            type: "chart",
            chartType: typeMatch[1],
            title: titleMatch?.[1],
            data,
        },
        endIndex,
    };
}

function ContentElement({ element }: { element: ParsedElement }) {
    switch (element.type) {
        case "heading": {
            const level = element.level;
            if (level === 1) return <h1>{element.content}</h1>;
            if (level === 2) return <h2>{element.content}</h2>;
            if (level === 3) return <h3>{element.content}</h3>;
            if (level === 4) return <h4>{element.content}</h4>;
            if (level === 5) return <h5>{element.content}</h5>;
            return <h6>{element.content}</h6>;
        }

        case "paragraph":
            return <p>{element.content}</p>;

        case "callout":
            return <CalloutComponent {...element} />;

        case "statcard":
            return <StatCardComponent {...element} />;

        case "quote":
            return <QuoteComponent {...element} />;

        case "stepguide":
            return <StepGuideComponent steps={element.steps} />;

        case "imagewithcaption":
            return <ImageWithCaptionComponent {...element} />;

        case "chart":
            return <ChartComponent {...element} />;

        case "code":
            return (
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                    <code
                        className={
                            element.language
                                ? `language-${element.language}`
                                : ""
                        }
                    >
                        {element.content}
                    </code>
                </pre>
            );

        case "list":
            const ListTag = element.ordered ? "ol" : "ul";
            return (
                <ListTag
                    className={element.ordered ? "list-decimal" : "list-disc"}
                >
                    {element.items.map((item, i) => (
                        <li key={i}>{item}</li>
                    ))}
                </ListTag>
            );

        default:
            return null;
    }
}

// Component Renderers

function CalloutComponent({
    calloutType,
    title,
    content,
}: {
    calloutType: string;
    title?: string;
    content: string;
}) {
    const icons = {
        info: Info,
        warning: AlertTriangle,
        success: CheckCircle,
        tip: Lightbulb,
    };
    const colors = {
        info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200",
        warning:
            "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200",
        success:
            "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200",
        tip: "bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-200",
    };

    const Icon = icons[calloutType as keyof typeof icons] || Info;
    const colorClass =
        colors[calloutType as keyof typeof colors] || colors.info;

    return (
        <div className={cn("not-prose p-4 rounded-lg border", colorClass)}>
            <div className="flex items-start gap-3">
                <Icon className="size-5 shrink-0 mt-0.5" />
                <div>
                    {title && <p className="font-semibold mb-1">{title}</p>}
                    <p className="text-sm">{content}</p>
                </div>
            </div>
        </div>
    );
}

function StatCardComponent({
    value,
    label,
    trend,
    trendDirection,
}: {
    value: string;
    label: string;
    trend?: string;
    trendDirection?: string;
}) {
    const TrendIcon =
        trendDirection === "up"
            ? TrendingUp
            : trendDirection === "down"
              ? TrendingDown
              : Minus;
    const trendColor =
        trendDirection === "up"
            ? "text-green-600"
            : trendDirection === "down"
              ? "text-red-600"
              : "text-muted-foreground";

    return (
        <div className="not-prose p-4 bg-muted rounded-lg border">
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground mt-1">{label}</p>
            {trend && (
                <div
                    className={cn(
                        "flex items-center gap-1 mt-2 text-sm",
                        trendColor,
                    )}
                >
                    <TrendIcon className="size-4" />
                    <span>{trend}</span>
                </div>
            )}
        </div>
    );
}

function QuoteComponent({
    author,
    role,
    content,
}: {
    author: string;
    role?: string;
    content: string;
}) {
    return (
        <blockquote className="not-prose border-l-4 border-primary pl-4 py-2 my-4">
            <QuoteIcon className="size-6 text-muted-foreground mb-2" />
            <p className="text-lg italic mb-2">{content}</p>
            <footer className="text-sm">
                <strong>{author}</strong>
                {role && (
                    <span className="text-muted-foreground"> — {role}</span>
                )}
            </footer>
        </blockquote>
    );
}

function StepGuideComponent({
    steps,
}: {
    steps: { title: string; content: string }[];
}) {
    return (
        <div className="not-prose space-y-4 my-6">
            {steps.map((step, i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex items-center justify-center size-8 rounded-full bg-primary text-primary-foreground font-bold shrink-0">
                        {i + 1}
                    </div>
                    <div>
                        <h4 className="font-semibold">{step.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            {step.content}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function ImageWithCaptionComponent({
    src,
    alt,
    caption,
    credit,
}: {
    src: string;
    alt: string;
    caption?: string;
    credit?: string;
}) {
    const [imageSrc, setImageSrc] = useState(src);
    useEffect(() => {
        setImageSrc(src);
    }, [src]);

    return (
        <figure className="not-prose my-6">
            <Image
                src={imageSrc}
                alt={alt}
                width={1200}
                height={675}
                unoptimized
                className="w-full rounded-lg"
                onError={() => setImageSrc(FALLBACK_IMAGE_SRC)}
            />
            {(caption || credit) && (
                <figcaption className="text-sm text-muted-foreground mt-2 text-center">
                    {caption}
                    {credit && (
                        <span className="block text-xs mt-1">{credit}</span>
                    )}
                </figcaption>
            )}
        </figure>
    );
}

function ChartComponent({
    chartType,
    title,
    data,
}: {
    chartType: string;
    title?: string;
    data: { label: string; value: number }[];
}) {
    // Simple bar chart visualization
    const maxValue = Math.max(...data.map((d) => d.value), 1);

    return (
        <div className="not-prose my-6 p-4 bg-muted rounded-lg">
            {title && <h4 className="font-semibold mb-4">{title}</h4>}
            {chartType === "bar" && (
                <div className="space-y-2">
                    {data.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="text-sm w-20 shrink-0">
                                {item.label}
                            </span>
                            <div className="flex-1 bg-background rounded-full h-4 overflow-hidden">
                                <div
                                    className="bg-primary h-full rounded-full transition-all"
                                    style={{
                                        width: `${(item.value / maxValue) * 100}%`,
                                    }}
                                />
                            </div>
                            <span className="text-sm w-12 text-right">
                                {item.value}
                            </span>
                        </div>
                    ))}
                </div>
            )}
            {chartType !== "bar" && (
                <p className="text-sm text-muted-foreground">
                    {chartType} chart preview not available
                </p>
            )}
        </div>
    );
}
