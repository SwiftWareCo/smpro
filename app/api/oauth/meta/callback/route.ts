import { auth } from "@clerk/nextjs/server";
import { fetchMutation } from "convex/nextjs";
import { redirect } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const META_GRAPH_URL = "https://graph.facebook.com/v24.0";

export async function GET(req: Request) {
    const { userId, getToken } = await auth();
    const { searchParams } = new URL(req.url);

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Parse state to get clientId for redirect
    let clientId: Id<"clients"> | null = null;
    let stateData: { userId: string; clientId?: string } | null = null;

    if (state) {
        try {
            stateData = JSON.parse(Buffer.from(state, "base64").toString());
            clientId = stateData?.clientId
                ? (stateData.clientId as Id<"clients">)
                : null;
        } catch {
            // State parsing failed
        }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    if (!appUrl || !appId || !appSecret) {
        throw new Error("Missing Meta OAuth environment variables");
    }

    // Helper to build redirect URL
    const buildRedirect = (path: string, params: Record<string, string>) => {
        const url = new URL(path, appUrl);
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });
        return url.pathname + url.search;
    };

    // Redirect destination based on clientId
    const getErrorRedirect = (errorType: string) => {
        if (clientId) {
            return buildRedirect(`/workspace/${clientId}`, {
                tab: "social",
                error: errorType,
            });
        }
        return `/?error=${errorType}`;
    };

    const getSuccessRedirect = () => {
        if (clientId) {
            return buildRedirect(`/workspace/${clientId}`, {
                tab: "social",
                success: "meta",
            });
        }
        return `/?success=meta`;
    };

    const token = await getToken({ template: "convex" });
    if (!token) {
        redirect(getErrorRedirect("unauthorized"));
    }
    const convexOptions = { token };

    // Handle user denial
    if (error) {
        console.error("OAuth error:", searchParams.get("error_description"));
        redirect(getErrorRedirect("denied"));
    }

    // Verify state
    if (!state || !userId) {
        redirect(getErrorRedirect("invalid_state"));
    }

    if (!stateData || stateData.userId !== userId) {
        redirect(getErrorRedirect("unauthorized"));
    }

    const redirectUri = `${appUrl}/api/oauth/meta/callback`;

    // Step 1: Exchange code for Business Integration System User Access Token
    const tokenUrl = new URL(`${META_GRAPH_URL}/oauth/access_token`);
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code!);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
        console.error("Token exchange error:", tokenData.error);
        redirect(getErrorRedirect("token_exchange"));
    }

    const accessToken = tokenData.access_token;

    // Step 2: Get client_business_id from /me endpoint
    const meRes = await fetch(
        `${META_GRAPH_URL}/me?fields=client_business_id&access_token=${accessToken}`,
    );
    const meData = await meRes.json();

    if (meData.error) {
        console.error("Failed to get client business ID:", meData.error);
        redirect(getErrorRedirect("business_id"));
    }

    const clientBusinessId = meData.client_business_id;

    // Step 3: Get Facebook Pages the user manages
    const pagesRes = await fetch(
        `${META_GRAPH_URL}/me/accounts?access_token=${accessToken}`,
    );
    const pagesData = await pagesRes.json();

    if (!pagesData.data || pagesData.data.length === 0) {
        redirect(getErrorRedirect("no_pages"));
    }

    // Step 4: For each page, check if it has an Instagram account
    for (const page of pagesData.data) {
        const pageAccessToken = page.access_token;
        const pageId = page.id;
        const pageName = page.name;

        await fetchMutation(
            api.accounts.upsert,
            {
                userId,
                clientId: clientId ?? undefined,
                platform: "facebook",
                accessToken: pageAccessToken,
                platformUserId: pageId,
                platformUsername: pageName,
                clientBusinessId,
                tokenExpiresAt: null,
            },
            convexOptions,
        );

        // Check for connected Instagram Business account
        const igRes = await fetch(
            `${META_GRAPH_URL}/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`,
        );
        const igData = await igRes.json();

        if (igData.instagram_business_account) {
            const igAccountId = igData.instagram_business_account.id;

            // Get Instagram account details
            const igDetailsRes = await fetch(
                `${META_GRAPH_URL}/${igAccountId}?fields=id,username,profile_picture_url,followers_count,media_count&access_token=${pageAccessToken}`,
            );
            const igDetails = await igDetailsRes.json();

            await fetchMutation(
                api.accounts.upsert,
                {
                    userId,
                    clientId: clientId ?? undefined,
                    platform: "instagram",
                    accessToken: pageAccessToken,
                    platformUserId: igAccountId,
                    platformUsername: igDetails.username,
                    clientBusinessId,
                    tokenExpiresAt: null,
                },
                convexOptions,
            );
        }
    }

    redirect(getSuccessRedirect());
}
