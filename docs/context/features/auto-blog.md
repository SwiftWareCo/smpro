# Auto-Blog

AI-powered blog automation that publishes SEO-optimized MDX to a client's GitHub repository on a schedule.

## Overview

The Auto-Blog module allows users to:
- Connect a client's GitHub repository via GitHub App installation
- Configure content path, posting cadence, and topic seeds
- Generate AI blog ideas and MDX drafts
- Optionally approve drafts before publishing
- Auto-commit posts on schedule, triggering Vercel builds

## Database Schema

Data lives in four tables:
- `autoblogSettings` - GitHub connection and configuration per client
- `autoblogIdeas` - AI-generated or manual blog topic ideas
- `autoblogPosts` - Draft and published blog posts (MDX content)
- `autoblogPublishLogs` - Publish attempt history and error tracking

## Key Files

```
components/workspace/autoblog-tab.tsx  # Main UI (wizard + config view)
convex/autoblog.ts                     # Queries/mutations for settings, posts
convex/github.ts                       # GitHub API integration (JWT, repos, commits)
app/github/callback/page.tsx           # OAuth callback bridge page
```

## GitHub App Integration

### Flow

1. **Install**: User clicks "Install GitHub App" button
   - Frontend redirects to `github.com/apps/{slug}/installations/new?state={clientId}`
   - `state` param contains base64-encoded `{ clientId }` to track which client

2. **Callback**: GitHub redirects to `/github/callback` with `installation_id` and `state`
   - Bridge page decodes `state` to get `clientId`
   - Redirects to `/workspace/{clientId}?tab=autoblog&installation_id=...`

3. **Save**: Autoblog tab detects `installation_id` in URL
   - Calls `saveGithubInstallation` mutation to store in DB
   - Cleans URL params

4. **Select Repo**: Repos auto-load when on repository step
   - `listInstallationRepos` action generates JWT, exchanges for token, fetches repos
   - User selects repo and content path
   - Saves full config to `autoblogSettings`

### JWT Generation (No External Libraries)

We use Node.js built-in `crypto` instead of `jose` for JWT generation:

```typescript
// convex/github.ts
"use node";
import { createPrivateKey, createSign } from "crypto";

function generateAppJwt(): string {
    const privateKey = createPrivateKey({
        key: PRIVATE_KEY,
        format: "pem",
    });
    
    const sign = createSign("RSA-SHA256");
    sign.update(signatureInput);
    const signature = sign.sign(privateKey);
    // ... base64url encode and return JWT
}
```

This approach:
- Works with PKCS#1 (`-----BEGIN RSA PRIVATE KEY-----`) format from GitHub
- Avoids external dependencies
- Requires `"use node";` directive for Convex Node.js runtime

### Environment Variables

```
GITHUB_APP_ID              # App ID from GitHub App settings
GITHUB_APP_PRIVATE_KEY     # Private key with \n for newlines
NEXT_PUBLIC_GITHUB_APP_SLUG # App slug for installation URL
```

For `GITHUB_APP_PRIVATE_KEY` in Convex, use `\n` between lines:
```
-----BEGIN RSA PRIVATE KEY-----\nMIIEog...\n-----END RSA PRIVATE KEY-----
```

## UI Structure

### Wizard Flow (Setup)

Three-step wizard for initial configuration:
1. **Connect GitHub** - Install GitHub App
2. **Select Repository** - Choose repo and content path
3. **Configure** - Set cadence, topics, layout, approval settings

### Summary View (Configured)

Once setup is complete (`isActive: true`), shows:
- Current configuration summary
- "Change Repository" button to reconfigure

## Security

- `saveGithubInstallation` mutation validates user owns the `clientId`
- `listInstallationRepos` action validates client ownership before fetching
- Installation tokens are short-lived (1 hour), generated on-demand
- JWTs are generated fresh for each request (10 min expiry)
