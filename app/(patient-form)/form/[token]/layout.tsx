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
        <div className="min-h-svh bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.10),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)]">
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                {children}
            </div>
        </div>
    );
}
