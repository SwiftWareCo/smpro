import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { fetchMutation } from 'convex/nextjs';
import { scrapeWebsite, type ScrapingProvider } from '@/lib/services/scraping';
import { analyzeWebsiteContent } from '@/lib/services/seo-analysis';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

export async function POST(request: NextRequest) {
  const authResult = await auth();
  const { userId } = authResult;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { url, provider = 'jina', clientId } = body as {
      url: string;
      provider?: ScrapingProvider;
      clientId?: string;
    };

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Step 1: Scrape the website
    const scrapeResult = await scrapeWebsite(url, provider);

    if (!scrapeResult.success || !scrapeResult.content) {
      return NextResponse.json(
        {
          error: scrapeResult.error || 'Failed to scrape website',
          provider: scrapeResult.provider,
        },
        { status: 422 }
      );
    }

    // Step 2: Analyze with AI
    const analysisResult = await analyzeWebsiteContent(scrapeResult.content);

    if (!analysisResult.success || !analysisResult.data) {
      return NextResponse.json(
        {
          error: analysisResult.error || 'AI analysis failed',
          provider: scrapeResult.provider,
        },
        { status: 422 }
      );
    }

    // Track usage if clientId is provided
    if (clientId) {
      const token = await authResult.getToken({ template: 'convex' });
      try {
        // Track scraping call
        await fetchMutation(
          api.usage.recordUsage,
          {
            clientId: clientId as Id<'clients'>,
            service: 'web_scraping',
          },
          { token: token ?? undefined },
        );
        // Track SEO analysis call
        await fetchMutation(
          api.usage.recordUsage,
          {
            clientId: clientId as Id<'clients'>,
            service: 'seo_analysis',
            promptTokens: analysisResult.usage?.promptTokens ?? 0,
            completionTokens: analysisResult.usage?.completionTokens ?? 0,
          },
          { token: token ?? undefined },
        );
      } catch (e) {
        console.error('SEO usage tracking failed:', e);
      }
    }

    // Return structured result (client will confirm before saving)
    return NextResponse.json({
      success: true,
      provider: scrapeResult.provider,
      data: {
        websiteUrl: url,
        ...analysisResult.data,
      },
    });
  } catch (error) {
    console.error('SEO analyze error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
