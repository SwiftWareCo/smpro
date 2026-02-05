import type { QueryCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

type IdeaStatus =
    | "pending_review"
    | "approved"
    | "rejected"
    | "converted_to_post";
type PostStatus = "draft" | "scheduled" | "publishing" | "published" | "failed";

export async function getSettingsByClient(
    ctx: QueryCtx,
    clientId: Id<"clients">,
) {
    return ctx.db
        .query("autoblogSettings")
        .withIndex("by_client_id", (q) => q.eq("clientId", clientId))
        .first();
}

export async function listPostsByClient(
    ctx: QueryCtx,
    clientId: Id<"clients">,
) {
    return ctx.db
        .query("autoblogPosts")
        .withIndex("by_client", (q) => q.eq("clientId", clientId))
        .collect();
}

export async function listIdeasByClient(
    ctx: QueryCtx,
    clientId: Id<"clients">,
    status?: IdeaStatus,
) {
    if (status) {
        return ctx.db
            .query("autoblogIdeas")
            .withIndex("by_client_status", (q) =>
                q.eq("clientId", clientId).eq("status", status),
            )
            .collect();
    }
    return ctx.db
        .query("autoblogIdeas")
        .withIndex("by_client", (q) => q.eq("clientId", clientId))
        .collect();
}

export async function getIdeaById(ctx: QueryCtx, ideaId: Id<"autoblogIdeas">) {
    return ctx.db.get(ideaId);
}

export async function getPostById(ctx: QueryCtx, postId: Id<"autoblogPosts">) {
    return ctx.db.get(postId);
}

export async function getPostBySlug(
    ctx: QueryCtx,
    clientId: Id<"clients">,
    slug: string,
) {
    return ctx.db
        .query("autoblogPosts")
        .withIndex("by_slug", (q) =>
            q.eq("clientId", clientId).eq("slug", slug),
        )
        .first();
}

export async function listPostsForCalendar(
    ctx: QueryCtx,
    clientId: Id<"clients">,
    startDate: number,
    endDate: number,
) {
    const posts = await ctx.db
        .query("autoblogPosts")
        .withIndex("by_client", (q) => q.eq("clientId", clientId))
        .collect();

    return posts.filter((post) => {
        const postDate =
            post.scheduledFor ?? post.publishedAt ?? post.createdAt;
        return postDate >= startDate && postDate <= endDate;
    });
}

export async function listPostsByStatus(
    ctx: QueryCtx,
    clientId: Id<"clients">,
    status: PostStatus,
) {
    return ctx.db
        .query("autoblogPosts")
        .withIndex("by_client_status", (q) =>
            q.eq("clientId", clientId).eq("status", status),
        )
        .collect();
}

export async function listPublishLogsByPost(
    ctx: QueryCtx,
    postId: Id<"autoblogPosts">,
) {
    return ctx.db
        .query("autoblogPublishLogs")
        .withIndex("by_post", (q) => q.eq("postId", postId))
        .order("desc")
        .collect();
}

export async function getLatestPublishLog(
    ctx: QueryCtx,
    postId: Id<"autoblogPosts">,
) {
    return ctx.db
        .query("autoblogPublishLogs")
        .withIndex("by_post", (q) => q.eq("postId", postId))
        .order("desc")
        .first();
}
