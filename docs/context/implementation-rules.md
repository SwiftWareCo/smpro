# Implementation Rules

- Follow SRP: each file handles one concern
- Create new files when needed for organization
- Use absolute imports with `@/` prefix
- Test changes with type checks before committing

## Validation Commands
- `pnpm run lint:types`
- `pnpm run lint:eslint`

## Delivery Notes
At the end of implementation, explain:
1) What command(s) need to be run
2) Why they are needed
3) Any data implications

## Convex-Specific Rules

### Node.js Runtime
When using Node.js built-in modules (`crypto`, `fs`, etc.) in Convex actions, add `"use node";` at the top of the file:
```typescript
"use node";
import { createPrivateKey } from "crypto";
```

### Actions vs Mutations
- **Mutations**: Database operations, must be deterministic
- **Actions**: External API calls, can use `fetch`, non-deterministic operations
- Actions can call mutations via `ctx.runMutation()`

## UI Patterns

### Wizard Flows
For multi-step setup processes:
1. Track current step based on data state (not local state)
2. Use `useRef` to prevent duplicate API calls on re-renders
3. Auto-advance when data indicates step is complete
4. Clean URL params after processing callbacks

### Preventing Double Effects
Use refs to track if an effect has already run:
```typescript
const hasProcessed = useRef(false);
useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    // ... effect logic
}, [deps]);
```
