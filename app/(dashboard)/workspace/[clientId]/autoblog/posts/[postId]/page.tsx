import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PostEditor } from "@/components/workspace/autoblog/post-editor";

interface PostEditorPageProps {
    params: Promise<{
        clientId: string;
        postId: string;
    }>;
}

export default async function PostEditorPage({ params }: PostEditorPageProps) {
    const { userId, getToken } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const token = await getToken({ template: "convex" });
    if (!token) {
        redirect("/sign-in");
    }

    const { clientId, postId } = await params;

    // Verify the user owns this client and post exists
    const [client, post, settings] = await Promise.all([
        fetchQuery(
            api.clients.get,
            { clientId: clientId as Id<"clients"> },
            { token }
        ),
        fetchQuery(
            api.autoblog.getPost,
            { postId: postId as Id<"autoblogPosts"> },
            { token }
        ),
        fetchQuery(
            api.autoblog.getSettings,
            { clientId: clientId as Id<"clients"> },
            { token }
        ),
    ]);

    if (!client) {
        redirect("/");
    }

    if (!post) {
        redirect(`/workspace/${clientId}?tab=autoblog`);
    }

    return (
        <div className="container max-w-7xl py-6">
            <PostEditor
                clientId={clientId as Id<"clients">}
                postId={postId as Id<"autoblogPosts">}
                initialPost={post}
                settings={settings}
            />
        </div>
    );
}
