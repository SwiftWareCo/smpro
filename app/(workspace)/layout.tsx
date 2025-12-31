import type { Metadata } from 'next';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { TopBar } from '@/components/dashboard/top-bar';
import { getClientsWithProjects } from '@/lib/data/data.clients';

export const metadata: Metadata = {
  title: 'SM Pro Workspace',
  description: 'Client workspace',
};

export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clients = await getClientsWithProjects();

  return (
    <SidebarProvider>
      <AppSidebar clients={clients} />
      <SidebarInset>
        <TopBar />
        <div className='flex flex-1 flex-col'>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

