'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

const errorMessages: Record<string, string> = {
  denied: 'You denied access to your Meta accounts',
  invalid_state: 'Invalid session state',
  token_exchange: 'Failed to exchange token',
  business_id: 'Failed to get business ID',
  no_pages: 'No Facebook Pages found',
};

export function SettingsToast() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'meta') {
      toast.success('Meta accounts connected successfully!');
    }
    if (error) {
      toast.error(errorMessages[error] || 'Connection failed');
    }
  }, [searchParams]);

  return null;
}
