type TrendDirection = "up" | "down" | "neutral";

interface StatCardProps {
    value: string;
    label: string;
    trend?: string;
    trendDirection?: TrendDirection;
}

const trendColors: Record<TrendDirection, string> = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-gray-500",
};

const trendIcons: Record<TrendDirection, string> = {
    up: "↑",
    down: "↓",
    neutral: "→",
};

export function StatCard({ value, label, trend, trendDirection = "neutral" }: StatCardProps) {
    return (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border my-4 inline-block min-w-[150px]">
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{label}</p>
            {trend && (
                <div className={`flex items-center gap-1 mt-2 text-sm ${trendColors[trendDirection]}`}>
                    <span>{trendIcons[trendDirection]}</span>
                    <span>{trend}</span>
                </div>
            )}
        </div>
    );
}
