'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { AppBreadcrumbs } from '@/components/dashboard/breadcrumbs';
import { Separator } from '@/components/ui/separator';
import ModeToggle from '@/components/mode-toggle';
import { UserButton } from '@clerk/nextjs';

export function TopBar() {
  return (
    <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
      <SidebarTrigger className='-ml-1' />
      <Separator
        orientation='vertical'
        className='mr-2 data-[orientation=vertical]:h-4'
      />
      <AppBreadcrumbs />
      <div className='ml-auto flex items-center gap-4'>
        <ModeToggle />
        <UserButton />
      </div>
    </header>
  );
}
