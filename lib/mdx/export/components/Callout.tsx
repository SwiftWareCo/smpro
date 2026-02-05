import { ReactNode } from "react";

type CalloutType = "info" | "warning" | "success" | "tip";

interface CalloutProps {
    type?: CalloutType;
    title?: string;
    children: ReactNode;
}

const icons: Record<CalloutType, string> = {
    info: "ℹ️",
    warning: "⚠️",
    success: "✅",
    tip: "💡",
};

const colors: Record<CalloutType, string> = {
    info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200",
    success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200",
    tip: "bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-200",
};

export function Callout({ type = "info", title, children }: CalloutProps) {
    return (
        <div className={`p-4 rounded-lg border my-6 ${colors[type]}`}>
            <div className="flex items-start gap-3">
                <span className="text-xl" role="img" aria-label={type}>
                    {icons[type]}
                </span>
                <div>
                    {title && <p className="font-semibold mb-1">{title}</p>}
                    <div className="text-sm">{children}</div>
                </div>
            </div>
        </div>
    );
}
