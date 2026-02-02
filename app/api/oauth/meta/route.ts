import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    // Get clientId from query params
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    const appId = process.env.META_APP_ID;
    const configId = process.env.META_CONFIG_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!appId || !configId || !appUrl) {
        throw new Error("Missing Meta OAuth environment variables");
    }

    const redirectUri = `${appUrl}/api/oauth/meta/callback`;

    // State contains userId and clientId for callback
    const state = Buffer.from(
        JSON.stringify({
            userId,
            clientId,
            timestamp: Date.now(),
        }),
    ).toString("base64");

    // Facebook Login for Business - use config_id instead of scope
    // Permissions are configured in the Meta App Dashboard configuration
    const authUrl = new URL("https://www.facebook.com/v24.0/dialog/oauth");
    authUrl.searchParams.set("client_id", appId);
    authUrl.searchParams.set("config_id", configId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("state", state);

    redirect(authUrl.toString());
}
