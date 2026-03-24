import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Patient Form",
    description: "Secure patient intake form",
};

export default function PatientFormLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div
            className="force-light min-h-svh bg-background"
            style={{ colorScheme: "light" }}
        >
            <div className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
                {children}
            </div>
        </div>
    );
}
