'use client';

import { useEffect, useState } from 'react';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Globe,
  Search,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface CrawlProgressProps {
  runId: string;
  onComplete: (result: CrawlResult) => void;
  onError: (error: string) => void;
}

interface CrawlResult {
  success: boolean;
  analysis?: {
    keywords: string[];
    location: string | null;
    industry: string;
    metaTitle: string | null;
    metaDescription: string | null;
    pagesSummary?: {
      totalAnalyzed: number;
      keyPages: string[];
    };
  };
  pagesDiscovered: number;
  pagesScraped: number;
  pagesAnalyzed: number;
  error?: string;
}

interface CrawlStatus {
  runId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'unknown';
  currentStep: string | null;
  result?: CrawlResult;
  error?: string;
}

const POLL_INTERVAL = 2000; // 2 seconds

const STEP_CONFIG = {
  pending: {
    label: 'Starting crawl...',
    icon: Loader2,
    progress: 0,
  },
  discovering: {
    label: 'Discovering pages on website...',
    icon: Search,
    progress: 20,
  },
  scraping: {
    label: 'Scraping page content...',
    icon: Globe,
    progress: 50,
  },
  aggregating: {
    label: 'Aggregating content...',
    icon: FileText,
    progress: 75,
  },
  analyzing: {
    label: 'Analyzing with AI...',
    icon: Sparkles,
    progress: 90,
  },
  processing: {
    label: 'Processing...',
    icon: Loader2,
    progress: 60,
  },
  completed: {
    label: 'Analysis complete!',
    icon: CheckCircle,
    progress: 100,
  },
  failed: {
    label: 'Crawl failed',
    icon: XCircle,
    progress: 0,
  },
};

export function CrawlProgress({
  runId,
  onComplete,
  onError,
}: CrawlProgressProps) {
  const [status, setStatus] = useState<CrawlStatus | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    if (!runId || !isPolling) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/seo/crawl/${runId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }

        const data: CrawlStatus = await response.json();
        setStatus(data);

        if (data.status === 'completed' && data.result) {
          setIsPolling(false);
          onComplete(data.result);
        } else if (data.status === 'failed') {
          setIsPolling(false);
          onError(data.error || 'Crawl failed');
        }
      } catch (error) {
        console.error('Error polling crawl status:', error);
        // Continue polling on transient errors
      }
    };

    // Initial poll
    pollStatus();

    // Set up interval
    const interval = setInterval(pollStatus, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [runId, isPolling, onComplete, onError]);

  const currentStep = status?.currentStep || 'pending';
  const stepConfig =
    STEP_CONFIG[currentStep as keyof typeof STEP_CONFIG] ||
    STEP_CONFIG.processing;
  const Icon = stepConfig.icon;
  const isSpinning = currentStep !== 'completed' && currentStep !== 'failed';

  return (
    <div className='space-y-4'>
      {/* Status indicator */}
      <div className='flex items-center gap-3'>
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full',
            currentStep === 'completed' && 'bg-green-100 text-green-600',
            currentStep === 'failed' && 'bg-red-100 text-red-600',
            currentStep !== 'completed' &&
              currentStep !== 'failed' &&
              'bg-primary/10 text-primary'
          )}
        >
          <Icon className={cn('h-5 w-5', isSpinning && 'animate-spin')} />
        </div>
        <div>
          <p className='font-medium'>{stepConfig.label}</p>
          {status?.result ? (
            <p className='text-sm text-muted-foreground'>
              {status.result.pagesDiscovered} pages found,{' '}
              {status.result.pagesScraped} scraped
            </p>
          ) : currentStep === 'processing' ? (
            <p className='text-sm text-muted-foreground animate-pulse'>
              Workflow is running... (Step details unavailable in local mode)
            </p>
          ) : null}
        </div>
      </div>

      {/* Progress bar */}
      {isPolling && (
        <div className='space-y-2'>
          <Progress value={stepConfig.progress} className='h-2' />
          <p className='text-xs text-muted-foreground text-right'>
            {stepConfig.progress}%
          </p>
        </div>
      )}

      {/* Step indicators */}
      <div className='flex items-center justify-between pt-2'>
        {['discovering', 'scraping', 'analyzing'].map((step, index) => {
          const isActive = currentStep === step;
          const isComplete =
            stepConfig.progress >
            STEP_CONFIG[step as keyof typeof STEP_CONFIG].progress;

          return (
            <div key={step} className='flex items-center gap-2'>
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                  isComplete && 'bg-primary text-primary-foreground',
                  isActive &&
                    'bg-primary/20 text-primary border border-primary',
                  !isComplete && !isActive && 'bg-muted text-muted-foreground'
                )}
              >
                {isComplete ? <CheckCircle className='h-4 w-4' /> : index + 1}
              </div>
              <span
                className={cn(
                  'text-sm capitalize',
                  isActive && 'font-medium text-primary',
                  !isActive && 'text-muted-foreground'
                )}
              >
                {step === 'discovering'
                  ? 'Discover'
                  : step === 'scraping'
                  ? 'Scrape'
                  : 'Analyze'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
