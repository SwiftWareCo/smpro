# Module System

Clients have an `enabledModules` array that controls which tabs appear in their workspace.

Example:
```ts
enabledModules: ["social", "seo", "ai-receptionist", "assets"]
```

Only enabled modules show in the workspace tabs. Each module has:
- A tab component in the workspace UI
- Setup checklist items in `lib/utils/setup-checklist.ts`
- A module-specific settings table (if needed)
