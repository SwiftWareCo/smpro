import { redirect } from "next/navigation";

type CallbackSearchParams = Record<string, string | string[] | undefined>;

interface GithubCallbackPageProps {
    searchParams: Promise<CallbackSearchParams>;
}

const firstParam = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

export default async function GithubCallbackPage({
    searchParams,
}: GithubCallbackPageProps) {
    const params = await searchParams;
    const installationId = firstParam(params.installation_id);
    const stateParam = firstParam(params.state);
    const setupAction = firstParam(params.setup_action) ?? "install";

    if (!installationId || !stateParam) {
        redirect("/");
    }

    try {
        const decoded = JSON.parse(
            Buffer.from(stateParam, "base64").toString("utf-8"),
        ) as { clientId?: string };
        const clientId = decoded.clientId;

        if (!clientId) {
            throw new Error("No client ID in state");
        }

        const query = new URLSearchParams({
            tab: "autoblog",
            installation_id: installationId,
            setup_action: setupAction,
        });
        redirect(`/workspace/${clientId}?${query.toString()}`);
    } catch (err) {
        console.error("Failed to parse GitHub state", err);
        redirect("/dashboard");
    }
}
