# SEO Wizard: Crawling & AI Tools

## Goal

Build an SEO wizard that:

1. Takes a website URL from the user
2. Crawls/scrapes the website to extract content
3. Uses AI to generate keywords, meta descriptions, industry detection
4. Shows confirmation screen before saving

---

## Executive Summary

**Recommended MVP Stack:**

| Component       | Tool             | Why                                                       |
| --------------- | ---------------- | --------------------------------------------------------- |
| **Scraping**    | Jina Reader      | Zero-setup, 1-line fetch, 20 RPM free, LLM-ready markdown |
| **AI Analysis** | Gemini 1.5 Flash | Massive 1M context window, 15 RPM free, you have it       |

**Cost**: $0 (within free tiers)  
**Implementation Time**: ~2 hours

---

## Part 1: Web Scraping Options

### Comparison Table

| Feature        | Jina Reader                                | Firecrawl             | Crawlee             | Browserless       |
| -------------- | ------------------------------------------ | --------------------- | ------------------- | ----------------- |
| **Best For**   | Instant URL-to-Markdown                    | Complex deep crawling | DIY & Custom Logic  | Hosting Puppeteer |
| **Free Tier**  | 20 req/min (no key), 10M tokens (with key) | 500 pages (one-time)  | Free (open source)  | 1,000 units/mo    |
| **Output**     | Clean Markdown                             | Clean Markdown        | Raw HTML/JSON       | HTML/JSON         |
| **JS Support** | ✅ (waits for hydration)                   | ✅ (excellent)        | ✅ (via Playwright) | ✅                |
| **Self-Host**  | ✅ Apache 2.0                              | ✅ AGPL-3.0           | N/A (library)       | ✅ Docker         |
| **Setup**      | Zero (just a URL)                          | SDK + API key         | Install + code      | Docker + API      |

---

### ⭐ Jina Reader (MVP Choice)

**What it is**: A "Reader LM" that treats URL extraction as a translation task (HTML → Clean Text).

**Why it wins for MVP**:

- **Zero setup** - just prepend `https://r.jina.ai/` to any URL
- **No API key required** for basic usage
- **Handles JavaScript** - waits for page hydration
- **Strips clutter** - removes navbars, footers, ads automatically
- **Returns LLM-ready Markdown**

**Usage**:

```typescript
// That's it. No SDK, no config.
const response = await fetch(`https://r.jina.ai/${targetUrl}`);
const markdown = await response.text();
```

**Rate Limits**:

- Without API key: 20 requests/minute
- With API key: + 10M tokens/month free

---

### Firecrawl

**What it is**: Gold standard for deep LLM scraping - can crawl entire sites.

**Pros**:

- Excellent at multi-page crawling (documentation sites, blogs)
- Can map entire website structure
- Clean markdown output

**Cons**:

- Free tier is one-time 500 pages (not recurring)
- Self-hosting requires managing browser fleet + proxies
- More complex setup

**When to use**: When you need to crawl more than just the homepage (future enhancement).

---

### Crawlee (Fallback/Self-Hosted)

**What it is**: Open-source Node.js scraping framework.

**Pros**:

- Complete control over scraping logic
- Wraps Playwright/Puppeteer with smart retries
- Free (just your server costs)

**Cons**:

- Returns raw HTML - needs `turndown` to convert to Markdown
- More code to write and maintain

**When to use**:

- Jina rate-limited
- Need 100% local/private processing
- Complex custom scraping needs

---

## Part 2: AI Analysis Options

### Comparison Table

| Provider          | Model             | Free Tier             | Context Window | Speed          |
| ----------------- | ----------------- | --------------------- | -------------- | -------------- |
| **Google Gemini** | 1.5/2.0 Flash     | 15 RPM, 1,500 req/day | 1M tokens      | Fast           |
| **Groq**          | Llama 3 / Mixtral | Moving to paid        | 8K-128K        | Instant (LPUs) |
| **Hugging Face**  | Various           | 1 req/hr (unauth)     | <32K           | Slow           |

---

### ⭐ Google Gemini 1.5 Flash (MVP Choice)

**Why it wins**:

- **Massive context window** (1M tokens) - can fit entire webpage
- **Generous free tier** - 15 RPM, ~1,500 requests/day
- **You already have access**

**Privacy Note**: Free tier data _may_ be used for model training. Since we're analyzing public websites, this is acceptable. Paid tier ($0.35/1M tokens) disables this.

**Usage via AI Studio**:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const result = await model.generateContent(`
  Analyze this website content. Return JSON:
  { keywords: string[], location: string, businessType: string, metaDescription: string }
  
  Content:
  ${markdown}
`);
```

---

### Groq (Speed Alternative)

**When to use**: If you need the UI to feel "instant" - Groq serves Llama 3 at lightning speed.

**Trade-off**: Moving away from generous free tier, smaller context windows.

---

## Part 3: MVP Architecture

```
User enters URL
       │
       ▼
┌─────────────────────────────────────┐
│  Step 1: URL Input                  │
│  [https://clientwebsite.com    ]    │
│  [Analyze Website →]                │
└─────────────────────────────────────┘
       │
       ▼  fetch(`https://r.jina.ai/${url}`)
       │
┌─────────────────────────────────────┐
│  Step 2: Processing...              │
│  ● Extracting content               │
│  ● Analyzing with AI                │
└─────────────────────────────────────┘
       │
       ▼  Gemini API call
       │
┌─────────────────────────────────────┐
│  Step 3: Review & Confirm           │
│                                     │
│  Detected Industry: Healthcare      │
│                                     │
│  Keywords:                          │
│  [dental clinic] [family dentist]   │
│  [+ Add]                            │
│                                     │
│  Location: Dallas, TX               │
│                                     │
│  [← Back] [Save Settings →]         │
└─────────────────────────────────────┘
```

---

## Part 4: Implementation Steps

### MVP (Phase 1)

1. **API Route**: `app/api/seo/analyze/route.ts`

   - Accept URL
   - Fetch from Jina Reader
   - Send to Gemini
   - Return structured JSON

2. **UI Wizard**: Dialog or inline in SEO tab

   - URL input step
   - Loading state
   - Editable results with tag inputs
   - Save to `client_seo_settings`

3. **Dependencies**:
   ```bash
   pnpm add @google/generative-ai
   ```
   (Jina needs no SDK - just fetch)

---

## Part 5: Future Enhancements

### Phase 2: Robust Stack (Self-Hosted)

When you outgrow free tiers or need privacy:

1. **Replace Jina with Crawlee**:

   ```bash
   pnpm add crawlee playwright turndown
   ```

   - Use `PlaywrightCrawler` for JS-heavy sites
   - Convert to Markdown with `turndown`

2. **Replace Gemini with Ollama (local)**:
   - Run Llama 3 on your own server
   - Zero API costs, full privacy

### Phase 3: Deep Crawling

- Use Firecrawl to crawl entire site (not just homepage)
- Analyze multiple pages for comprehensive SEO audit
- Generate site-wide keyword strategy

### Phase 4: Monitoring

- Track keyword rankings over time
- PageSpeed integration
- Google Search Console API

---

## Cost Analysis

### MVP (Free Tier)

| Service      | Usage                   | Cost                |
| ------------ | ----------------------- | ------------------- |
| Jina Reader  | 1 page per client       | $0 (20 RPM free)    |
| Gemini Flash | 1 analysis per client   | $0 (1,500/day free) |
| **Total**    | 20 clients × 1 analysis | **$0**              |

### If Free Tier Exceeded

| Service         | Cost                       |
| --------------- | -------------------------- |
| Gemini Flash    | $0.075/1M input tokens     |
| Jina (with key) | 10M tokens free, then paid |

---

## Decision

✅ **Proceed with Jina Reader + Gemini 1.5 Flash**

- Fastest to implement (zero SDK for scraping)
- Completely free for <20 clients
- Clean markdown output for LLM
- 1M context window handles any page size
