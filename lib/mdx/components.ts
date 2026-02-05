export type CalloutType = "info" | "warning" | "success" | "tip";
export type ChartType = "bar" | "line" | "pie";
export type TrendDirection = "up" | "down" | "neutral";

export interface CalloutProps {
    type: CalloutType;
    title?: string;
    children: string;
}

export interface StatCardProps {
    value: string;
    label: string;
    trend?: string;
    trendDirection?: TrendDirection;
}

export interface QuoteProps {
    author: string;
    role?: string;
    children: string;
}

export interface StepGuideStep {
    title: string;
    content: string;
}

export interface StepGuideProps {
    steps: StepGuideStep[];
}

export interface ChartDataPoint {
    label: string;
    value: number;
    color?: string;
}

export interface ChartProps {
    type: ChartType;
    data: ChartDataPoint[];
    title?: string;
}

export interface ImageWithCaptionProps {
    src: string;
    alt: string;
    caption?: string;
    credit?: string;
}

export const MDX_COMPONENTS = {
    Callout: {
        name: "Callout",
        description: "Highlighted information box with different styles for tips, warnings, success messages, and general info",
        props: {
            type: {
                type: "CalloutType",
                required: true,
                options: ["info", "warning", "success", "tip"],
                description: "The style/color of the callout",
            },
            title: {
                type: "string",
                required: false,
                description: "Optional title for the callout",
            },
            children: {
                type: "string",
                required: true,
                description: "The content inside the callout",
            },
        },
        example: `<Callout type="tip" title="Pro Tip">
  Regular HVAC maintenance can reduce energy bills by up to 15%.
</Callout>`,
    },
    StatCard: {
        name: "StatCard",
        description: "Display a statistic with optional trend indicator",
        props: {
            value: {
                type: "string",
                required: true,
                description: "The main statistic value (e.g., '95%', '$1,500')",
            },
            label: {
                type: "string",
                required: true,
                description: "Description of what the stat represents",
            },
            trend: {
                type: "string",
                required: false,
                description: "Trend indicator (e.g., '+5%', '-10%')",
            },
            trendDirection: {
                type: "TrendDirection",
                required: false,
                options: ["up", "down", "neutral"],
                description: "Direction of the trend for styling",
            },
        },
        example: `<StatCard
  value="95%"
  label="Customer Satisfaction"
  trend="+5%"
  trendDirection="up"
/>`,
    },
    Quote: {
        name: "Quote",
        description: "Styled quote block with attribution",
        props: {
            author: {
                type: "string",
                required: true,
                description: "Name of the person being quoted",
            },
            role: {
                type: "string",
                required: false,
                description: "Title or role of the person",
            },
            children: {
                type: "string",
                required: true,
                description: "The quote text",
            },
        },
        example: `<Quote author="John Smith" role="Homeowner">
  Switching to a smart thermostat cut our energy bills in half!
</Quote>`,
    },
    StepGuide: {
        name: "StepGuide",
        description: "Numbered step-by-step guide with titles and content",
        props: {
            steps: {
                type: "StepGuideStep[]",
                required: true,
                description: "Array of steps with title and content",
            },
        },
        example: `<StepGuide steps={[
  { title: "Turn off the power", content: "Locate your circuit breaker and turn off power to the HVAC unit." },
  { title: "Replace the filter", content: "Remove the old filter and insert a new one with arrows pointing toward the unit." },
  { title: "Restore power", content: "Turn the circuit breaker back on and test the system." }
]} />`,
    },
    Chart: {
        name: "Chart",
        description: "Data visualization chart (bar, line, or pie)",
        props: {
            type: {
                type: "ChartType",
                required: true,
                options: ["bar", "line", "pie"],
                description: "The type of chart to render",
            },
            data: {
                type: "ChartDataPoint[]",
                required: true,
                description: "Array of data points with label and value",
            },
            title: {
                type: "string",
                required: false,
                description: "Title displayed above the chart",
            },
        },
        example: `<Chart
  type="bar"
  title="Energy Savings by Season"
  data={[
    { label: "Spring", value: 15 },
    { label: "Summer", value: 25 },
    { label: "Fall", value: 12 },
    { label: "Winter", value: 30 }
  ]}
/>`,
    },
    ImageWithCaption: {
        name: "ImageWithCaption",
        description: "Image with optional caption and credit attribution",
        props: {
            src: {
                type: "string",
                required: true,
                description: "URL of the image",
            },
            alt: {
                type: "string",
                required: true,
                description: "Alt text for accessibility",
            },
            caption: {
                type: "string",
                required: false,
                description: "Caption text below the image",
            },
            credit: {
                type: "string",
                required: false,
                description: "Photo credit attribution",
            },
        },
        example: `<ImageWithCaption
  src="/images/hvac-maintenance.jpg"
  alt="Technician performing HVAC maintenance"
  caption="Regular maintenance keeps your system running efficiently"
  credit="Photo by John Doe on Unsplash"
/>`,
    },
} as const;

export type MDXComponentName = keyof typeof MDX_COMPONENTS;

export const LAYOUT_COMPONENTS: Record<"callout" | "story" | "guide", MDXComponentName[]> = {
    callout: ["Callout", "StatCard", "ImageWithCaption", "Chart"],
    story: ["Quote", "ImageWithCaption", "Callout"],
    guide: ["StepGuide", "Callout", "StatCard", "ImageWithCaption", "Chart"],
};

export function getComponentsForLayout(layout: "callout" | "story" | "guide"): string {
    const components = LAYOUT_COMPONENTS[layout];
    return components
        .map((name) => {
            const comp = MDX_COMPONENTS[name];
            return `### ${comp.name}\n${comp.description}\n\nExample:\n\`\`\`jsx\n${comp.example}\n\`\`\``;
        })
        .join("\n\n");
}

export function generateFrontmatter(options: {
    title: string;
    slug: string;
    excerpt: string;
    author?: string;
    publishedAt: string;
    tags?: string[];
    featuredImage?: string;
    readingTime?: number;
}): string {
    const lines = [
        "---",
        `title: "${options.title.replace(/"/g, '\\"')}"`,
        `slug: "${options.slug}"`,
        `excerpt: "${options.excerpt.replace(/"/g, '\\"')}"`,
    ];

    if (options.author) {
        lines.push(`author: "${options.author}"`);
    }

    lines.push(`publishedAt: "${options.publishedAt}"`);

    if (options.tags && options.tags.length > 0) {
        lines.push(`tags:`);
        options.tags.forEach((tag) => lines.push(`  - "${tag}"`));
    }

    if (options.featuredImage) {
        lines.push(`featuredImage: "${options.featuredImage}"`);
    }

    if (options.readingTime) {
        lines.push(`readingTime: ${options.readingTime}`);
    }

    lines.push("---");

    return lines.join("\n");
}

export function calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
}

export function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60);
}
