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
