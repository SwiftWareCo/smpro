"use node";

import { createPrivateKey, createSign } from "crypto";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

type GitHubRepo = {
    id: number;
    fullName: string;
    name: string;
    owner: string;
    defaultBranch: string;
    private: boolean;
};

const APP_ID = process.env.GITHUB_APP_ID;
const PRIVATE_KEY = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n");

function base64UrlEncode(data: string | Buffer): string {
    const base64 = Buffer.from(data).toString("base64");
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateAppJwt(): string {
    if (!APP_ID || !PRIVATE_KEY) {
        throw new Error("Missing GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY");
    }

    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iat: now - 60, // issued 60 seconds ago to account for clock drift
        exp: now + 10 * 60, // expires in 10 minutes
        iss: APP_ID,
    };

    const header = { alg: "RS256", typ: "JWT" };
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));

    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    const privateKey = createPrivateKey({
        key: PRIVATE_KEY,
        format: "pem",
    });

    const sign = createSign("RSA-SHA256");
    sign.update(signatureInput);
    const signature = sign.sign(privateKey);
    const encodedSignature = base64UrlEncode(signature);

    return `${signatureInput}.${encodedSignature}`;
}

async function getInstallationToken(installationId: number): Promise<string> {
    const jwt = generateAppJwt();
    const res = await fetch(
        `https://api.github.com/app/installations/${installationId}/access_tokens`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${jwt}`,
                Accept: "application/vnd.github+json",
            },
        },
    );

    if (!res.ok) {
        const error = await res.text();
        throw new Error(`Failed to get installation token: ${error}`);
    }

    const data = await res.json();
    return data.token;
}

async function getInstallationRepos(
    installationId: number,
): Promise<GitHubRepo[]> {
    const token = await getInstallationToken(installationId);

    const res = await fetch(
        "https://api.github.com/installation/repositories",
        {
            headers: {
                Authorization: `token ${token}`,
                Accept: "application/vnd.github+json",
            },
        },
    );

    if (!res.ok) {
        const error = await res.text();
        throw new Error(`Failed to fetch repos: ${error}`);
    }

    const data = await res.json();

    return data.repositories.map((repo: any) => ({
        id: repo.id,
        fullName: repo.full_name,
        name: repo.name,
        owner: repo.owner.login,
        defaultBranch: repo.default_branch,
        private: repo.private,
    }));
}

export const listInstallationRepos = action({
    args: {
        clientId: v.id("clients"),
        installationId: v.number(),
    },
    handler: async (ctx, args) => {
        // Validate user owns client (throws if unauthorized)
        await ctx.runQuery(api.clients.get, { clientId: args.clientId });

        return getInstallationRepos(args.installationId);
    },
});
