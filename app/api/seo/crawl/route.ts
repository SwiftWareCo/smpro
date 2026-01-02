import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { start } from 'workflow/api';
import { seoCrawlWorkflow, type CrawlParams } from '@/workflows/seo-crawl';
import { type ScrapingProvider } from '@/lib/services/scraping';
import { DEFAULT_MAX_PAGES, MAX_PAGES_TO_CRAWL } from '@/lib/constants/seo';

export const maxDuration = 300; // 5 minutes max for workflow start

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  // if (!userId) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const body = await request.json();
    const {
      url,
      clientId,
      provider = 'jina',
      maxPages = DEFAULT_MAX_PAGES,
    } = body as {
      url: string;
      clientId: string;
      provider?: ScrapingProvider;
      maxPages?: number;
    };

    // Validate inputs
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    if (!clientId || typeof clientId !== 'string') {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Clamp maxPages to valid range
    const clampedMaxPages = Math.min(
      Math.max(1, maxPages),
      MAX_PAGES_TO_CRAWL
    );

    // Start the workflow
    const params: CrawlParams = {
      rootUrl: url,
      clientId,
      provider,
      maxPages: clampedMaxPages,
    };

    const run = await start(seoCrawlWorkflow, [params]);

    return NextResponse.json({
      success: true,
      runId: run.runId,
      message: 'Crawl workflow started',
    });
  } catch (error) {
    console.error('SEO crawl start error:', error);
    return NextResponse.json(
      { error: 'Failed to start crawl workflow' },
      { status: 500 }
    );
  }
}
