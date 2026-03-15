"use node";

import { createPrivateKey, createSign } from "crypto";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { requireAgencyAdmin } from "./_lib/auth";

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
        await requireAgencyAdmin(ctx);
        // Validate user owns client (throws if unauthorized)
        await ctx.runQuery(api.clients.get, { clientId: args.clientId });

        return getInstallationRepos(args.installationId);
    },
});

interface CommitFileResult {
    success: boolean;
    commitSha?: string;
    error?: string;
}

async function getFileContent(
    token: string,
    owner: string,
    repo: string,
    path: string,
    branch: string,
): Promise<{ sha: string; content: string } | null> {
    const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
        {
            headers: {
                Authorization: `token ${token}`,
                Accept: "application/vnd.github+json",
            },
        },
    );

    if (res.status === 404) {
        return null;
    }

    if (!res.ok) {
        const error = await res.text();
        throw new Error(`Failed to get file: ${error}`);
    }

    const data = await res.json();
    return {
        sha: data.sha,
        content: Buffer.from(data.content, "base64").toString("utf-8"),
    };
}

async function createOrUpdateFile(
    token: string,
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch: string,
    existingSha?: string,
): Promise<CommitFileResult> {
    const body: Record<string, string> = {
        message,
        content: Buffer.from(content).toString("base64"),
        branch,
    };

    if (existingSha) {
        body.sha = existingSha;
    }

    const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        {
            method: "PUT",
            headers: {
                Authorization: `token ${token}`,
                Accept: "application/vnd.github+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        },
    );

    if (!res.ok) {
        const error = await res.text();
        return {
            success: false,
            error: `Failed to commit file: ${res.status} - ${error}`,
        };
    }

    const data = await res.json();
    return {
        success: true,
        commitSha: data.commit.sha,
    };
}

export const commitFile = action({
    args: {
        clientId: v.id("clients"),
        filePath: v.string(),
        content: v.string(),
        commitMessage: v.string(),
    },
    handler: async (ctx, args): Promise<CommitFileResult> => {
        await requireAgencyAdmin(ctx);
        // Get autoblog settings for installation ID and repo info
        const settings = await ctx.runQuery(api.autoblog.getSettings, {
            clientId: args.clientId,
        });

        if (!settings) {
            return { success: false, error: "Autoblog not configured" };
        }

        if (!settings.githubInstallationId) {
            return { success: false, error: "GitHub not connected" };
        }

        if (!settings.repoOwner || !settings.repoName) {
            return { success: false, error: "Repository not configured" };
        }

        const branch = settings.defaultBranch || "main";

        try {
            const token = await getInstallationToken(
                settings.githubInstallationId,
            );

            // Check if file exists to get its SHA for update
            const existingFile = await getFileContent(
                token,
                settings.repoOwner,
                settings.repoName,
                args.filePath,
                branch,
            );

            // Create or update the file
            const result = await createOrUpdateFile(
                token,
                settings.repoOwner,
                settings.repoName,
                args.filePath,
                args.content,
                args.commitMessage,
                branch,
                existingFile?.sha,
            );

            return result;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    },
});
