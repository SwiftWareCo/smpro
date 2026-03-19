import { requirePortalModule } from "../_lib/portal-access";

export default async function PortalKnowledgeBaseLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    await requirePortalModule("knowledge_base");
    return children;
}
