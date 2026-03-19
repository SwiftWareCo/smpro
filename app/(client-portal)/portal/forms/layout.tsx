import { requirePortalModule } from "../_lib/portal-access";

export default async function PortalFormsLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    await requirePortalModule("patient_forms");
    return children;
}
