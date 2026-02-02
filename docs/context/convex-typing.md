# Convex Typing (Next.js)

Convex provides end-to-end TypeScript types that flow from your schema to backend functions and into frontend hooks/helpers.

## 1) Schema → data model types
`npx convex dev` generates `convex/_generated/dataModel.d.ts` with `Doc<"table">` and `Id<"table">`.

```ts
import type { Doc, Id } from "@/convex/_generated/dataModel";

function MessageView(props: { message: Doc<"messages"> }) {}
function MessageDetails(props: { id: Id<"messages"> }) {}
```

## 2) Validators → function arg/return types
Arguments are inferred from validators in queries/mutations/actions.

## 3) Generated API → typed calls from Next.js
`npx convex dev` also generates `convex/_generated/api.d.ts` for typed function refs.

Client components:
```ts
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const messages = useQuery(api.messages.list);
const sendMessage = useMutation(api.messages.sendMessage);
```

Server code (Route Handlers / Server Actions):
```ts
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const messages = await fetchQuery(api.messages.list, {});
await fetchMutation(api.messages.sendMessage, { body: "hi", author: "me" });
```

## 4) Sharing types in your Next.js app
```ts
import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";

type ChannelId = Id<"channels">;
type Message = Doc<"messages">;

type ListMessagesResult = FunctionReturnType<typeof api.messages.list>;
```
