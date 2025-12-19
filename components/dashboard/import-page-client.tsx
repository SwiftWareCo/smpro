'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Trash2, Upload, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  deleteClient,
  importInstagramData,
  importFacebookData,
} from '@/lib/actions/clients';

type Client = {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

interface ImportPageClientProps {
  initialClients: Client[];
}

interface ImportFormData {
  clientId: string;
  platform: 'instagram' | 'facebook';
  jsonData: string;
}

export function ImportPageClient({ initialClients }: ImportPageClientProps) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const importForm = useForm<ImportFormData>({
    defaultValues: {
      clientId: '',
      platform: 'instagram',
      jsonData: '',
    },
  });

  async function onDeleteClient(clientId: string, clientName: string) {
    setDeletingId(clientId);
    startTransition(async () => {
      const result = await deleteClient(clientId);

      if (result.success) {
        toast.success(`Client "${clientName}" deleted`);
        setClients((prev) => prev.filter((c) => c.id !== clientId));
        // Clear import form if deleted client was selected
        if (importForm.getValues('clientId') === clientId) {
          importForm.setValue('clientId', '');
        }
      } else {
        toast.error(result.error || 'Failed to delete client');
      }
      setDeletingId(null);
    });
  }

  async function onImport(data: ImportFormData) {
    if (!data.clientId) {
      toast.error('Please select a client');
      return;
    }

    if (!data.jsonData.trim()) {
      toast.error('Please paste JSON data');
      return;
    }

    startTransition(async () => {
      const importFn =
        data.platform === 'instagram' ? importInstagramData : importFacebookData;
      const result = await importFn(data.clientId, data.jsonData);

      if (result.success) {
        toast.success(result.message);
        importForm.setValue('jsonData', '');
      } else {
        toast.error(result.error || 'Failed to import data');
      }
    });
  }

  return (
    <div className='grid gap-6 lg:grid-cols-2'>
      {/* Import Data Card */}
      <Card className='lg:col-span-2'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Upload className='h-5 w-5' />
            Import Data
          </CardTitle>
          <CardDescription>
            Paste JSON from Graph API Explorer to import content for a client.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...importForm}>
            <form
              onSubmit={importForm.handleSubmit(onImport)}
              className='space-y-4'
            >
              <div className='grid gap-4 sm:grid-cols-2'>
                <FormField
                  control={importForm.control}
                  name='clientId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Select a client' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.length === 0 ? (
                            <SelectItem value='none' disabled>
                              No clients - use &quot;Add Client&quot; in sidebar
                            </SelectItem>
                          ) : (
                            clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={importForm.control}
                  name='platform'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='instagram'>Instagram</SelectItem>
                          <SelectItem value='facebook'>Facebook</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={importForm.control}
                name='jsonData'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Response JSON</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Paste the JSON response from Graph API Explorer...'
                        className='min-h-[300px] font-mono text-xs'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type='submit'
                disabled={isPending || clients.length === 0}
                className='w-full sm:w-auto'
              >
                {isPending ? (
                  <Loader2 className='h-4 w-4 animate-spin mr-2' />
                ) : (
                  <Upload className='h-4 w-4 mr-2' />
                )}
                Import Data
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Existing Clients List */}
      <Card className='lg:col-span-2'>
        <CardHeader>
          <CardTitle>Manage Clients ({clients.length})</CardTitle>
          <CardDescription>
            Delete clients or use &quot;Add Client&quot; in the sidebar to create new ones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <p className='text-zinc-400 text-center py-8'>
              No clients yet. Click &quot;Add Client&quot; in the sidebar to get started.
            </p>
          ) : (
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
              {clients.map((client) => (
                <div
                  key={client.id}
                  className='flex items-center justify-between p-3 rounded-lg border border-border bg-card'
                >
                  <div className='min-w-0'>
                    <p className='font-medium truncate'>{client.name}</p>
                    {client.description && (
                      <p className='text-sm text-zinc-400 truncate'>
                        {client.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10'
                    onClick={() => onDeleteClient(client.id, client.name)}
                    disabled={deletingId === client.id}
                  >
                    {deletingId === client.id ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      <Trash2 className='h-4 w-4' />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
