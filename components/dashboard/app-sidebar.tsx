'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  ChevronRight,
  LayoutDashboard,
  FileText,
  Lightbulb,
  Settings,
  Users,
  Plus,
  Search,
  Loader2,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { createClient } from '@/lib/actions/clients';

type Client = {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  clients: Client[];
}

interface CreateClientFormData {
  name: string;
  description: string;
}

const navMain = [
  {
    title: 'Dashboard',
    url: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Ideas',
    url: '/ideas',
    icon: Lightbulb,
  },
  {
    title: 'Import',
    url: '/import',
    icon: Plus,
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
  },
];

export function AppSidebar({ clients, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedClientId = searchParams.get('client');

  const [searchQuery, setSearchQuery] = React.useState('');
  const [mainOpen, setMainOpen] = React.useState(true);
  const [clientsOpen, setClientsOpen] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  const form = useForm<CreateClientFormData>({
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const filteredClients = React.useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const query = searchQuery.toLowerCase();
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(query) ||
        client.description?.toLowerCase().includes(query)
    );
  }, [clients, searchQuery]);

  async function onCreateClient(data: CreateClientFormData) {
    setIsPending(true);
    const result = await createClient({
      name: data.name,
      description: data.description || undefined,
    });

    if (result.success && result.client) {
      toast.success(`Client "${data.name}" created successfully`);
      form.reset();
      setDialogOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to create client');
    }
    setIsPending(false);
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className='flex items-center justify-center gap-2 px-4 py-3 mx-2 my-2 bg-card rounded-lg shadow-md border border-border'>
          <h2 className='text-lg font-semibold'>SM Pro</h2>
        </div>
        <div className='px-2'>
          <div className='relative'>
            <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
            <SidebarInput
              placeholder='Search clients...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-8'
            />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/* Main Navigation */}
        <Collapsible open={mainOpen} onOpenChange={setMainOpen} className='group/collapsible'>
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className='flex w-full items-center justify-between cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors'>
                Main
                <ChevronRight className='h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navMain.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.url}
                      >
                        <Link href={item.url}>
                          <item.icon className='h-4 w-4' />
                          {item.title}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Clients Section */}
        <Collapsible open={clientsOpen} onOpenChange={setClientsOpen} className='group/collapsible'>
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className='flex w-full items-center justify-between cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors'>
                <span className='flex items-center gap-2'>
                  <Users className='h-4 w-4' />
                  Clients
                  {clients.length > 0 && (
                    <span className='text-xs text-muted-foreground'>
                      ({clients.length})
                    </span>
                  )}
                </span>
                <ChevronRight className='h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {/* All Content option */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/content' && !selectedClientId}
                    >
                      <Link href='/content'>
                        <FileText className='h-4 w-4' />
                        All Content
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {filteredClients.length === 0 && searchQuery ? (
                    <div className='px-2 py-3 text-sm text-muted-foreground text-center'>
                      No clients match &quot;{searchQuery}&quot;
                    </div>
                  ) : filteredClients.length === 0 ? (
                    <div className='px-2 py-3 text-sm text-muted-foreground text-center'>
                      No clients yet
                    </div>
                  ) : (
                    filteredClients.map((client) => (
                      <SidebarMenuItem key={client.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={selectedClientId === client.id}
                        >
                          <Link href={`/content?client=${client.id}`}>
                            <div className='flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary'>
                              {client.name.charAt(0).toUpperCase()}
                            </div>
                            <span className='truncate'>{client.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))
                  )}

                  {/* Add Client Dialog */}
                  <SidebarMenuItem>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <SidebarMenuButton className='text-muted-foreground hover:text-foreground cursor-pointer'>
                          <Plus className='h-4 w-4' />
                          Add Client
                        </SidebarMenuButton>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Client</DialogTitle>
                          <DialogDescription>
                            Add a new client/brand to organize your content.
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                          <form
                            onSubmit={form.handleSubmit(onCreateClient)}
                            className='space-y-4'
                          >
                            <FormField
                              control={form.control}
                              name='name'
                              rules={{ required: 'Client name is required' }}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder='e.g., Nike, Demo Brand' {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name='description'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description (optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder='Brief description...' {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className='flex justify-end gap-2'>
                              <Button
                                type='button'
                                variant='outline'
                                onClick={() => setDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button type='submit' disabled={isPending}>
                                {isPending ? (
                                  <Loader2 className='h-4 w-4 animate-spin mr-2' />
                                ) : (
                                  <Plus className='h-4 w-4 mr-2' />
                                )}
                                Create
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
