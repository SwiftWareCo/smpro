# Auto-Blog

Scope of the Auto-Blog module:
- Connect a client's GitHub repo and content folder
- Generate AI blog ideas and MDX drafts
- Optional approval before publish
- Scheduled commits that trigger Vercel builds

Data lives in `autoblogSettings`, `autoblogIdeas`, `autoblogPosts`, `autoblogPublishLogs`.
UI lives in `components/workspace/autoblog-tab.tsx`.
