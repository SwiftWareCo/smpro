type ConvexErrorPayload = {
    code?: string;
    message?: string;
};

function tryParseConvexPayload(raw: string) {
    try {
        return JSON.parse(raw) as ConvexErrorPayload;
    } catch {
        return null;
    }
}

export function getErrorMessage(
    error: unknown,
    fallback = "Something went wrong",
) {
    if (!error) return fallback;

    if (typeof error === "string") {
        return error.trim() || fallback;
    }

    if (typeof error === "object" && error !== null) {
        const maybeMessage = (error as { message?: unknown }).message;
        if (typeof maybeMessage === "string") {
            const convexJsonMatch = maybeMessage.match(
                /Uncaught ConvexError:\s*(\{[\s\S]*\})/,
            );
            if (convexJsonMatch?.[1]) {
                const payload = tryParseConvexPayload(convexJsonMatch[1]);
                if (payload?.message) return payload.message;
            }

            const plain = maybeMessage
                .replace(/\[CONVEX[^\]]+\]\s*/g, "")
                .replace(/\[Request ID:[^\]]+\]\s*/g, "")
                .replace(/^Server Error\s*/g, "")
                .trim();
            if (plain) return plain;
        }

        const maybeData = (error as { data?: unknown }).data;
        if (
            maybeData &&
            typeof maybeData === "object" &&
            "message" in maybeData &&
            typeof (maybeData as { message?: unknown }).message === "string"
        ) {
            return (maybeData as { message: string }).message;
        }
    }

    return fallback;
}
