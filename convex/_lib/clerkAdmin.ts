"use node";

type ClerkApiErrorItem = {
    code?: string;
    message?: string;
    long_message?: string;
    meta?: {
        param_name?: string;
        paramName?: string;
    };
};

type ClerkApiErrorBody = {
    errors?: ClerkApiErrorItem[];
};

export class ClerkApiError extends Error {
    status: number;
    details: ClerkApiErrorItem[];

    constructor(status: number, details: ClerkApiErrorItem[]) {
        super(details[0]?.long_message ?? details[0]?.message ?? "Clerk API error");
        this.status = status;
        this.details = details;
    }
}

const CLERK_API_BASE_URL = "https://api.clerk.com/v1";

function getClerkSecretKey() {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
        throw new Error("Missing CLERK_SECRET_KEY in Convex environment");
    }
    return secretKey;
}

async function clerkRequest<T>(
    path: string,
    init?: {
        method?: "GET" | "POST" | "DELETE";
        body?: unknown;
    },
) {
    const response = await fetch(`${CLERK_API_BASE_URL}${path}`, {
        method: init?.method ?? "GET",
        headers: {
            Authorization: `Bearer ${getClerkSecretKey()}`,
            "Content-Type": "application/json",
        },
        body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    });

    const text = await response.text();
    const payload = text ? (JSON.parse(text) as unknown) : null;

    if (!response.ok) {
        const errorBody = (payload as ClerkApiErrorBody | null) ?? {};
        throw new ClerkApiError(response.status, errorBody.errors ?? []);
    }

    return payload as T;
}

export async function clerkUserExistsByEmail(email: string) {
    const params = new URLSearchParams();
    params.append("email_address[]", email);
    params.append("limit", "1");

    const result = await clerkRequest<{
        data?: Array<{ id: string }>;
        total_count?: number;
    }>(`/users?${params.toString()}`);

    if (typeof result.total_count === "number") {
        return result.total_count > 0;
    }

    return (result.data?.length ?? 0) > 0;
}

export async function clerkCreateOrganization(args: {
    name: string;
    slug: string;
    createdBy: string;
}) {
    return clerkRequest<{ id: string }>("/organizations", {
        method: "POST",
        body: {
            name: args.name,
            slug: args.slug,
            created_by: args.createdBy,
        },
    });
}

export async function clerkCreateUser(args: { email: string; password: string }) {
    return clerkRequest<{ id: string }>("/users", {
        method: "POST",
        body: {
            email_address: [args.email],
            password: args.password,
            skip_password_checks: false,
        },
    });
}

export async function clerkCreateOrganizationMembership(args: {
    organizationId: string;
    userId: string;
    role: "org:admin" | "org:member";
}) {
    return clerkRequest<{ id: string }>(
        `/organizations/${args.organizationId}/memberships`,
        {
            method: "POST",
            body: {
                user_id: args.userId,
                role: args.role,
            },
        },
    );
}

export async function clerkDeleteUser(userId: string) {
    await clerkRequest(`/users/${userId}`, {
        method: "DELETE",
    });
}

export async function clerkDeleteOrganization(organizationId: string) {
    await clerkRequest(`/organizations/${organizationId}`, {
        method: "DELETE",
    });
}
