export function getClientPortalUrl() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl) {
        return `${appUrl.replace(/\/+$/, "")}/portal`;
    }
    return "/portal";
}
