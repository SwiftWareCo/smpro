# SM Pro MDX Components

This directory contains the MDX components used by the SM Pro autoblog feature. Copy these components to your Next.js project to render AI-generated blog posts.

## Installation

1. Copy the `components` folder to your project (e.g., `components/mdx/`)
2. Install dependencies (if not already installed):
   ```bash
   npm install next
   ```

## Setup with next-mdx-remote

```tsx
// lib/mdx.ts
import { Callout } from "@/components/mdx/Callout";
import { StatCard } from "@/components/mdx/StatCard";
import { Quote } from "@/components/mdx/Quote";
import { StepGuide } from "@/components/mdx/StepGuide";
import { Chart } from "@/components/mdx/Chart";
import { ImageWithCaption } from "@/components/mdx/ImageWithCaption";

export const mdxComponents = {
  Callout,
  StatCard,
  Quote,
  StepGuide,
  Chart,
  ImageWithCaption,
};
```

```tsx
// app/blog/[slug]/page.tsx
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/lib/mdx";

export default async function BlogPost({ params }) {
  const post = await getPost(params.slug); // Your data fetching logic

  return (
    <article className="prose dark:prose-invert max-w-none">
      <MDXRemote source={post.content} components={mdxComponents} />
    </article>
  );
}
```

## Components

### Callout

Highlighted information boxes with different styles.

```jsx
<Callout type="tip" title="Pro Tip">
  Regular maintenance can save you money in the long run.
</Callout>

<Callout type="warning">
  Always turn off power before performing any maintenance.
</Callout>
```

**Props:**
- `type`: "info" | "warning" | "success" | "tip" (default: "info")
- `title`: Optional title text
- `children`: Content inside the callout

### StatCard

Display statistics with optional trend indicators.

```jsx
<StatCard 
  value="95%" 
  label="Customer Satisfaction" 
  trend="+5%" 
  trendDirection="up" 
/>
```

**Props:**
- `value`: The main statistic (e.g., "95%", "$1,500")
- `label`: Description of the stat
- `trend`: Optional trend indicator (e.g., "+5%")
- `trendDirection`: "up" | "down" | "neutral"

### Quote

Styled quote blocks with attribution.

```jsx
<Quote author="John Smith" role="Homeowner">
  Switching to a smart thermostat cut our energy bills in half!
</Quote>
```

**Props:**
- `author`: Name of the person being quoted (required)
- `role`: Optional title or role
- `children`: The quote text

### StepGuide

Numbered step-by-step instructions.

```jsx
<StepGuide steps={[
  { title: "Turn off power", content: "Locate your circuit breaker..." },
  { title: "Replace the filter", content: "Remove the old filter..." },
  { title: "Restore power", content: "Turn the breaker back on..." }
]} />
```

**Props:**
- `steps`: Array of `{ title: string, content: string }`

### Chart

Simple data visualization (bar charts).

```jsx
<Chart 
  type="bar" 
  title="Energy Savings by Season"
  data={[
    { label: "Spring", value: 15 },
    { label: "Summer", value: 25 },
    { label: "Fall", value: 12 },
    { label: "Winter", value: 30 }
  ]} 
/>
```

**Props:**
- `type`: "bar" | "pie" | "line" (default: "bar")
- `data`: Array of `{ label: string, value: number, color?: string }`
- `title`: Optional chart title

### ImageWithCaption

Images with captions and credit attribution.

```jsx
<ImageWithCaption 
  src="/images/hvac-maintenance.jpg" 
  alt="Technician performing maintenance"
  caption="Regular maintenance keeps your system running efficiently"
  credit="Photo by John Doe on Unsplash"
/>
```

**Props:**
- `src`: Image URL (required)
- `alt`: Alt text for accessibility (required)
- `caption`: Optional caption text
- `credit`: Optional photo credit
- `width`: Image width (default: 800)
- `height`: Image height (default: 400)

## Styling

These components use Tailwind CSS classes. Make sure your project has Tailwind configured with:

- `prose` classes for markdown content (via `@tailwindcss/typography`)
- Dark mode support via `dark:` prefix
- The following colors in your theme:
  - `primary` / `primary-foreground`
  - Blue, yellow, green, purple variants for callouts

## Customization

Feel free to modify the components to match your site's design system. The components are intentionally simple to make customization easy.
