'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Globe,
  Loader2,
  Sparkles,
  X,
  Plus,
  RefreshCw,
  Pencil,
  Check,
  Layers,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { updateSeoSettings, getSeoSettings } from '@/lib/actions/seo';
import {
  INDUSTRY_OPTIONS,
  type IndustryType,
  DEFAULT_MAX_PAGES,
  MAX_PAGES_TO_CRAWL,
} from '@/lib/constants/seo';
import { CrawlProgress } from './crawl-progress';

interface SeoTabProps {
  clientId: string;
}

type WizardStep = 'input' | 'analyzing' | 'crawling' | 'review' | 'saved';
type CrawlMode = 'single' | 'multi';

interface AnalysisData {
  websiteUrl: string;
  keywords: string[];
  location: string | null;
  industry: IndustryType;
  metaTitle: string | null;
  metaDescription: string | null;
}

interface SavedSettings {
  websiteUrl: string | null;
  targetKeywords: string[] | null;
  targetLocations: string[] | null;
  industry: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  analyzedAt: Date | null;
  analysisProvider: string | null;
}

export function SeoTab({ clientId }: SeoTabProps) {
  const [step, setStep] = useState<WizardStep>('input');
  const [url, setUrl] = useState('');
  const [provider, setProvider] = useState<'jina' | 'firecrawl'>('jina');
  const [crawlMode, setCrawlMode] = useState<CrawlMode>('single');
  const [maxPages, setMaxPages] = useState(DEFAULT_MAX_PAGES);
  const [crawlRunId, setCrawlRunId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [savedSettings, setSavedSettings] = useState<SavedSettings | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pagesAnalyzed, setPagesAnalyzed] = useState(0);

  // Editable fields
  const [editKeywords, setEditKeywords] = useState<string[]>([]);
  const [editLocation, setEditLocation] = useState('');
  const [editIndustry, setEditIndustry] = useState<IndustryType>('other');
  const [editMetaTitle, setEditMetaTitle] = useState('');
  const [editMetaDescription, setEditMetaDescription] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

  // Load existing settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const result = await getSeoSettings(clientId);
        if (result.success && result.settings) {
          setSavedSettings(result.settings as SavedSettings);
          setUrl(result.settings.websiteUrl || '');
          setStep('saved');
        }
      } catch (error) {
        console.error('Failed to load SEO settings:', error);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [clientId]);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast.error('Please enter a website URL');
      return;
    }

    // Validate URL format
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    setUrl(fullUrl);

    // Multi-page mode uses workflow-based crawling
    if (crawlMode === 'multi') {
      setStep('crawling');
      try {
        const response = await fetch('/api/seo/crawl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: fullUrl,
            clientId,
            provider,
            maxPages,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to start crawl');
        }

        setCrawlRunId(data.runId);
        // CrawlProgress component will handle polling and call onComplete
      } catch (error) {
        console.error('Crawl start error:', error);
        toast.error(
          error instanceof Error ? error.message : 'Failed to start crawl'
        );
        setStep('input');
      }
      return;
    }

    // Single-page mode uses direct analysis
    setStep('analyzing');
    setAnalyzing(true);

    try {
      const response = await fetch('/api/seo/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fullUrl, provider }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      const result: AnalysisData = data.data;
      setAnalysisData(result);

      // Initialize edit fields with results
      setEditKeywords(result.keywords);
      setEditLocation(result.location || '');
      setEditIndustry(result.industry);
      setEditMetaTitle(result.metaTitle || '');
      setEditMetaDescription(result.metaDescription || '');

      setStep('review');
      setPagesAnalyzed(1);
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(error instanceof Error ? error.message : 'Analysis failed');
      setStep('input');
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle crawl completion from CrawlProgress component
  const handleCrawlComplete = useCallback(
    (result: {
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
    }) => {
      if (!result.success || !result.analysis) {
        toast.error(result.error || 'Crawl analysis failed');
        setStep('input');
        setCrawlRunId(null);
        return;
      }

      const analysisResult = result.analysis;

      // Validate industry is a valid IndustryType
      const industry = INDUSTRY_OPTIONS.includes(
        analysisResult.industry as IndustryType
      )
        ? (analysisResult.industry as IndustryType)
        : 'other';

      setAnalysisData({
        websiteUrl: url,
        keywords: analysisResult.keywords,
        location: analysisResult.location,
        industry,
        metaTitle: analysisResult.metaTitle,
        metaDescription: analysisResult.metaDescription,
      });

      // Initialize edit fields with results
      setEditKeywords(analysisResult.keywords);
      setEditLocation(analysisResult.location || '');
      setEditIndustry(industry);
      setEditMetaTitle(analysisResult.metaTitle || '');
      setEditMetaDescription(analysisResult.metaDescription || '');

      setPagesAnalyzed(result.pagesAnalyzed);
      setCrawlRunId(null);
      setStep('review');
      toast.success(
        `Analysis complete! ${result.pagesAnalyzed} pages analyzed.`
      );
    },
    [url]
  );

  const handleCrawlError = useCallback((error: string) => {
    toast.error(error);
    setStep('input');
    setCrawlRunId(null);
  }, []);

  const handleSave = async () => {
    setSaving(true);

    try {
      const result = await updateSeoSettings(clientId, {
        websiteUrl: url,
        targetKeywords: editKeywords,
        targetLocations: editLocation ? [editLocation] : [],
        industry: editIndustry,
        metaTitle: editMetaTitle || null,
        metaDescription: editMetaDescription || null,
        analyzedAt: new Date(),
        analysisProvider: provider,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to save');
      }

      setSavedSettings(result.settings as SavedSettings);
      setStep('saved');
      setIsEditing(false);
      toast.success('SEO settings saved!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to save settings'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !editKeywords.includes(newKeyword.trim())) {
      setEditKeywords([...editKeywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setEditKeywords(editKeywords.filter((k) => k !== keyword));
  };

  const handleReanalyze = () => {
    setStep('input');
    setAnalysisData(null);
  };

  const handleEdit = () => {
    if (savedSettings) {
      setEditKeywords(savedSettings.targetKeywords || []);
      setEditLocation(savedSettings.targetLocations?.[0] || '');
      setEditIndustry((savedSettings.industry as IndustryType) || 'other');
      setEditMetaTitle(savedSettings.metaTitle || '');
      setEditMetaDescription(savedSettings.metaDescription || '');
    }
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const formatIndustry = (industry: string) => {
    return industry
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* URL Input Step */}
      {step === 'input' && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Globe className='h-5 w-5' />
              Analyze Website
            </CardTitle>
            <CardDescription>
              Enter your client&apos;s website URL to automatically generate SEO
              settings using AI
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='url'>Website URL</Label>
              <Input
                id='url'
                type='url'
                placeholder='https://example.com'
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              />
            </div>

            <Separator />

            {/* Crawl Mode Toggle */}
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label htmlFor='crawl-mode' className='text-sm font-medium'>
                    Multi-Page Crawl
                  </Label>
                  <p className='text-xs text-muted-foreground'>
                    Crawl entire website for comprehensive analysis
                  </p>
                </div>
                <Switch
                  id='crawl-mode'
                  checked={crawlMode === 'multi'}
                  onCheckedChange={(checked) =>
                    setCrawlMode(checked ? 'multi' : 'single')
                  }
                />
              </div>

              {/* Max Pages Slider (only shown in multi-page mode) */}
              {crawlMode === 'multi' && (
                <div className='space-y-2 pl-4 border-l-2 border-muted'>
                  <div className='flex items-center justify-between'>
                    <Label htmlFor='max-pages' className='text-sm'>
                      Max Pages
                    </Label>
                    <span className='text-sm font-medium'>{maxPages}</span>
                  </div>
                  <Slider
                    id='max-pages'
                    min={5}
                    max={MAX_PAGES_TO_CRAWL}
                    step={5}
                    value={[maxPages]}
                    onValueChange={([value]) => setMaxPages(value)}
                    className='w-full'
                  />
                  <p className='text-xs text-muted-foreground'>
                    Important pages (homepage, about, services) are prioritized
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Provider Toggle */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Label
                  htmlFor='provider-switch'
                  className='text-sm text-muted-foreground'
                >
                  Use Firecrawl
                </Label>
                <Switch
                  id='provider-switch'
                  checked={provider === 'firecrawl'}
                  onCheckedChange={(checked) =>
                    setProvider(checked ? 'firecrawl' : 'jina')
                  }
                />
              </div>
              <span className='text-xs text-muted-foreground'>
                Provider: {provider === 'jina' ? 'Jina Reader' : 'Firecrawl'}
              </span>
            </div>

            <Button onClick={handleAnalyze} className='w-full'>
              {crawlMode === 'multi' ? (
                <>
                  <Layers className='mr-2 h-4 w-4' />
                  Crawl & Analyze Website
                </>
              ) : (
                <>
                  <Sparkles className='mr-2 h-4 w-4' />
                  Analyze Website
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Analyzing Step (Single Page) */}
      {step === 'analyzing' && (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <Loader2 className='h-12 w-12 animate-spin text-primary mb-4' />
            <h3 className='text-lg font-medium mb-2'>Analyzing Website</h3>
            <p className='text-sm text-muted-foreground text-center'>
              Extracting content and generating SEO recommendations...
            </p>
            <p className='text-xs text-muted-foreground mt-2'>
              Using {provider === 'jina' ? 'Jina Reader' : 'Firecrawl'} + Gemini
              AI
            </p>
          </CardContent>
        </Card>
      )}

      {/* Crawling Step (Multi-Page) */}
      {step === 'crawling' && crawlRunId && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Layers className='h-5 w-5' />
              Crawling Website
            </CardTitle>
            <CardDescription>
              Discovering and analyzing multiple pages on the website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CrawlProgress
              runId={crawlRunId}
              onComplete={handleCrawlComplete}
              onError={handleCrawlError}
            />
            <div className='mt-4 pt-4 border-t'>
              <Button
                variant='outline'
                onClick={() => {
                  setStep('input');
                  setCrawlRunId(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Step */}
      {step === 'review' && analysisData && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Check className='h-5 w-5 text-green-500' />
              Review AI Suggestions
            </CardTitle>
            <CardDescription>
              Review and edit the AI-generated SEO settings before saving
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Website URL (read-only) */}
            <div className='space-y-2'>
              <Label>Website URL</Label>
              <Input value={url} disabled />
            </div>

            <Separator />

            {/* Industry */}
            <div className='space-y-2'>
              <Label htmlFor='industry'>Industry</Label>
              <Select
                value={editIndustry}
                onValueChange={(v) => setEditIndustry(v as IndustryType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_OPTIONS.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {formatIndustry(industry)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Keywords */}
            <div className='space-y-2'>
              <Label>Keywords</Label>
              <div className='flex flex-wrap gap-2 mb-2'>
                {editKeywords.map((keyword) => (
                  <Badge key={keyword} variant='secondary' className='gap-1'>
                    {keyword}
                    <button
                      onClick={() => handleRemoveKeyword(keyword)}
                      className='ml-1 hover:text-destructive'
                    >
                      <X className='h-3 w-3' />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className='flex gap-2'>
                <Input
                  placeholder='Add keyword...'
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' &&
                    (e.preventDefault(), handleAddKeyword())
                  }
                />
                <Button
                  variant='outline'
                  size='icon'
                  onClick={handleAddKeyword}
                >
                  <Plus className='h-4 w-4' />
                </Button>
              </div>
            </div>

            {/* Location */}
            <div className='space-y-2'>
              <Label htmlFor='location'>Service Location</Label>
              <Input
                id='location'
                placeholder='e.g., Dallas, TX'
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
              />
            </div>

            {/* Meta Title */}
            <div className='space-y-2'>
              <Label htmlFor='metaTitle'>
                Meta Title{' '}
                <span className='text-xs text-muted-foreground'>
                  ({editMetaTitle.length}/60)
                </span>
              </Label>
              <Input
                id='metaTitle'
                placeholder='SEO title for this client...'
                value={editMetaTitle}
                onChange={(e) => setEditMetaTitle(e.target.value.slice(0, 60))}
                maxLength={60}
              />
            </div>

            {/* Meta Description */}
            <div className='space-y-2'>
              <Label htmlFor='metaDescription'>
                Meta Description{' '}
                <span className='text-xs text-muted-foreground'>
                  ({editMetaDescription.length}/160)
                </span>
              </Label>
              <Textarea
                id='metaDescription'
                placeholder='SEO description for this client...'
                value={editMetaDescription}
                onChange={(e) =>
                  setEditMetaDescription(e.target.value.slice(0, 160))
                }
                maxLength={160}
                rows={3}
              />
            </div>

            <Separator />

            {/* Actions */}
            <div className='flex gap-2'>
              <Button
                variant='outline'
                onClick={handleReanalyze}
                disabled={saving}
              >
                <RefreshCw className='mr-2 h-4 w-4' />
                Re-analyze
              </Button>
              <Button
                variant='outline'
                className='text-destructive hover:text-destructive'
                onClick={() => {
                  if (
                    confirm(
                      'Are you sure you want to discard these results and start over?'
                    )
                  ) {
                    handleReanalyze();
                  }
                }}
                disabled={saving}
              >
                <X className='mr-2 h-4 w-4' />
                Reject & Start Over
              </Button>
              <Button onClick={handleSave} disabled={saving} className='flex-1'>
                {saving ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved State */}
      {step === 'saved' && savedSettings && !isEditing && (
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>
                  Last analyzed:{' '}
                  {savedSettings.analyzedAt
                    ? new Date(savedSettings.analyzedAt).toLocaleDateString()
                    : 'Manual entry'}
                </CardDescription>
              </div>
              <div className='flex gap-2'>
                <Button variant='outline' size='sm' onClick={handleEdit}>
                  <Pencil className='mr-2 h-4 w-4' />
                  Edit
                </Button>
                <Button variant='outline' size='sm' onClick={handleReanalyze}>
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Re-analyze
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Website */}
            <div>
              <Label className='text-xs text-muted-foreground'>Website</Label>
              <p className='text-sm'>{savedSettings.websiteUrl || 'Not set'}</p>
            </div>

            {/* Industry */}
            <div>
              <Label className='text-xs text-muted-foreground'>Industry</Label>
              <p className='text-sm'>
                {savedSettings.industry
                  ? formatIndustry(savedSettings.industry)
                  : 'Not set'}
              </p>
            </div>

            {/* Keywords */}
            <div>
              <Label className='text-xs text-muted-foreground'>Keywords</Label>
              <div className='flex flex-wrap gap-1 mt-1'>
                {savedSettings.targetKeywords &&
                savedSettings.targetKeywords.length > 0 ? (
                  savedSettings.targetKeywords.map((keyword) => (
                    <Badge key={keyword} variant='secondary'>
                      {keyword}
                    </Badge>
                  ))
                ) : (
                  <span className='text-sm text-muted-foreground'>
                    No keywords
                  </span>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <Label className='text-xs text-muted-foreground'>
                Service Location
              </Label>
              <p className='text-sm'>
                {savedSettings.targetLocations?.[0] || 'Not set'}
              </p>
            </div>

            {/* Meta Title */}
            <div>
              <Label className='text-xs text-muted-foreground'>
                Meta Title
              </Label>
              <p className='text-sm'>{savedSettings.metaTitle || 'Not set'}</p>
            </div>

            {/* Meta Description */}
            <div>
              <Label className='text-xs text-muted-foreground'>
                Meta Description
              </Label>
              <p className='text-sm'>
                {savedSettings.metaDescription || 'Not set'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Mode */}
      {step === 'saved' && isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>Edit SEO Settings</CardTitle>
            <CardDescription>Manually update the SEO settings</CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Industry */}
            <div className='space-y-2'>
              <Label htmlFor='edit-industry'>Industry</Label>
              <Select
                value={editIndustry}
                onValueChange={(v) => setEditIndustry(v as IndustryType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_OPTIONS.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {formatIndustry(industry)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Keywords */}
            <div className='space-y-2'>
              <Label>Keywords</Label>
              <div className='flex flex-wrap gap-2 mb-2'>
                {editKeywords.map((keyword) => (
                  <Badge key={keyword} variant='secondary' className='gap-1'>
                    {keyword}
                    <button
                      onClick={() => handleRemoveKeyword(keyword)}
                      className='ml-1 hover:text-destructive'
                    >
                      <X className='h-3 w-3' />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className='flex gap-2'>
                <Input
                  placeholder='Add keyword...'
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' &&
                    (e.preventDefault(), handleAddKeyword())
                  }
                />
                <Button
                  variant='outline'
                  size='icon'
                  onClick={handleAddKeyword}
                >
                  <Plus className='h-4 w-4' />
                </Button>
              </div>
            </div>

            {/* Location */}
            <div className='space-y-2'>
              <Label htmlFor='edit-location'>Service Location</Label>
              <Input
                id='edit-location'
                placeholder='e.g., Dallas, TX'
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
              />
            </div>

            {/* Meta Title */}
            <div className='space-y-2'>
              <Label htmlFor='edit-metaTitle'>
                Meta Title{' '}
                <span className='text-xs text-muted-foreground'>
                  ({editMetaTitle.length}/60)
                </span>
              </Label>
              <Input
                id='edit-metaTitle'
                placeholder='SEO title for this client...'
                value={editMetaTitle}
                onChange={(e) => setEditMetaTitle(e.target.value.slice(0, 60))}
                maxLength={60}
              />
            </div>

            {/* Meta Description */}
            <div className='space-y-2'>
              <Label htmlFor='edit-metaDescription'>
                Meta Description{' '}
                <span className='text-xs text-muted-foreground'>
                  ({editMetaDescription.length}/160)
                </span>
              </Label>
              <Textarea
                id='edit-metaDescription'
                placeholder='SEO description for this client...'
                value={editMetaDescription}
                onChange={(e) =>
                  setEditMetaDescription(e.target.value.slice(0, 160))
                }
                maxLength={160}
                rows={3}
              />
            </div>

            <Separator />

            {/* Actions */}
            <div className='flex gap-2'>
              <Button
                variant='outline'
                onClick={handleCancelEdit}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className='flex-1'>
                {saving ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
