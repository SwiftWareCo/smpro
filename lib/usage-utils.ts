export function getCurrentPeriodKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
}

export function getLastNPeriodKeys(n: number): string[] {
    const keys: string[] = [];
    const now = new Date();
    for (let i = 0; i < n; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        keys.push(`${year}-${month}`);
    }
    return keys;
}

export function formatPeriodKey(periodKey: string): string {
    const [year, month] = periodKey.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
    });
}

export const SERVICE_DISPLAY_NAMES: Record<string, string> = {
    kb_chat: "KB Chat",
    kb_embedding: "KB Embedding",
    blog_generation: "Blog Generation",
    seo_analysis: "SEO Analysis",
    topic_generation: "Topic Generation",
    trending_topics: "Trending Topics",
    form_translation: "Form Translation",
    web_scraping: "Web Scraping",
    email_delivery: "Email Delivery",
};

export const SERVICE_CATEGORIES: Record<
    string,
    { label: string; services: string[] }
> = {
    ai: {
        label: "AI / LLM",
        services: [
            "kb_chat",
            "blog_generation",
            "seo_analysis",
            "topic_generation",
            "trending_topics",
            "form_translation",
        ],
    },
    external: {
        label: "External APIs",
        services: ["kb_embedding", "web_scraping"],
    },
    notifications: {
        label: "Notifications",
        services: ["email_delivery"],
    },
};

export const SERVICE_COLORS: Record<string, string> = {
    kb_chat: "hsl(220, 70%, 55%)",
    kb_embedding: "hsl(200, 60%, 50%)",
    blog_generation: "hsl(150, 60%, 45%)",
    seo_analysis: "hsl(30, 80%, 55%)",
    topic_generation: "hsl(270, 60%, 55%)",
    trending_topics: "hsl(300, 50%, 50%)",
    form_translation: "hsl(180, 60%, 45%)",
    web_scraping: "hsl(45, 70%, 50%)",
    email_delivery: "hsl(0, 60%, 55%)",
};
