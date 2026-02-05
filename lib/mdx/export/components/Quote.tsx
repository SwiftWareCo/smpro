import { ReactNode } from "react";

interface QuoteProps {
    author: string;
    role?: string;
    children: ReactNode;
}

export function Quote({ author, role, children }: QuoteProps) {
    return (
        <blockquote className="border-l-4 border-primary pl-4 py-2 my-6">
            <div className="text-4xl text-gray-300 dark:text-gray-700 mb-2">"</div>
            <p className="text-lg italic mb-4">{children}</p>
            <footer className="text-sm">
                <strong>{author}</strong>
                {role && <span className="text-gray-600 dark:text-gray-400"> — {role}</span>}
            </footer>
        </blockquote>
    );
}
