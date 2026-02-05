"use client";

type ChartType = "bar" | "line" | "pie";

interface ChartDataPoint {
    label: string;
    value: number;
    color?: string;
}

interface ChartProps {
    type?: ChartType;
    data: ChartDataPoint[];
    title?: string;
}

export function Chart({ type = "bar", data, title }: ChartProps) {
    const maxValue = Math.max(...data.map((d) => d.value), 1);

    return (
        <div className="my-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            {title && <h4 className="font-semibold mb-4">{title}</h4>}

            {type === "bar" && (
                <div className="space-y-3">
                    {data.map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <span className="text-sm w-24 shrink-0 truncate">{item.label}</span>
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${(item.value / maxValue) * 100}%`,
                                        backgroundColor: item.color || "#3b82f6",
                                    }}
                                />
                            </div>
                            <span className="text-sm w-12 text-right font-medium">{item.value}</span>
                        </div>
                    ))}
                </div>
            )}

            {type === "pie" && (
                <div className="flex flex-wrap gap-4 justify-center">
                    {data.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: item.color || `hsl(${i * 50}, 70%, 50%)` }}
                            />
                            <span className="text-sm">
                                {item.label}: {item.value}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {type === "line" && (
                <p className="text-sm text-gray-500">
                    Line chart visualization requires a charting library like recharts.
                </p>
            )}
        </div>
    );
}
