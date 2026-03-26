<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->

## Data migration policy (current project stage)

- This app currently has no production users.
- For schema/data migrations, it may be acceptable to delete/reset existing data instead of implementing complex migrations.
- Before any destructive data operation (delete/reset/backfill overwrite), always notify the user first and get explicit confirmation.
