import { useConvexAuth, useQuery } from "convex/react";
import type { FunctionReference, FunctionArgs } from "convex/server";

export function useAuthenticatedQuery<F extends FunctionReference<"query">>(
    query: F,
    args: FunctionArgs<F> | "skip",
): F["_returnType"] | undefined {
    const { isAuthenticated } = useConvexAuth();
    const resolvedArgs = (isAuthenticated && args !== "skip" ? args : "skip") as
        | FunctionArgs<F>
        | "skip";
    return useQuery(
        query,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolvedArgs as any,
    );
}
