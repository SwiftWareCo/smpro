export interface UnsplashImage {
    id: string;
    url: string;
    thumbnailUrl: string;
    smallUrl: string;
    regularUrl: string;
    photographer: string;
    photographerUrl: string;
    photographerUsername: string;
    downloadUrl: string;
    altDescription: string | null;
    width: number;
    height: number;
}

interface UnsplashApiPhoto {
    id: string;
    urls: {
        raw: string;
        full: string;
        regular: string;
        small: string;
        thumb: string;
    };
    user: {
        name: string;
        username: string;
        links: {
            html: string;
        };
    };
    links: {
        download_location: string;
    };
    alt_description: string | null;
    width: number;
    height: number;
}

interface UnsplashSearchResponse {
    total: number;
    total_pages: number;
    results: UnsplashApiPhoto[];
}

function getAccessKey(): string {
    const key = process.env.UNSPLASH_ACCESS_KEY;
    if (!key) {
        throw new Error("UNSPLASH_ACCESS_KEY environment variable is not set");
    }
    return key;
}

function transformPhoto(photo: UnsplashApiPhoto): UnsplashImage {
    return {
        id: photo.id,
        url: photo.urls.full,
        thumbnailUrl: photo.urls.thumb,
        smallUrl: photo.urls.small,
        regularUrl: photo.urls.regular,
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
        photographerUsername: photo.user.username,
        downloadUrl: photo.links.download_location,
        altDescription: photo.alt_description,
        width: photo.width,
        height: photo.height,
    };
}

export async function searchImages(
    query: string,
    count: number = 10,
    page: number = 1,
): Promise<UnsplashImage[]> {
    const accessKey = getAccessKey();

    const params = new URLSearchParams({
        query,
        per_page: String(Math.min(count, 30)),
        page: String(page),
        orientation: "landscape",
    });

    const response = await fetch(
        `https://api.unsplash.com/search/photos?${params}`,
        {
            headers: {
                Authorization: `Client-ID ${accessKey}`,
                "Accept-Version": "v1",
            },
        },
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Unsplash API error: ${response.status} - ${errorText}`);
    }

    const data: UnsplashSearchResponse = await response.json();
    return data.results.map(transformPhoto);
}

export async function getRandomImage(
    query: string,
): Promise<UnsplashImage | null> {
    const accessKey = getAccessKey();

    const params = new URLSearchParams({
        query,
        orientation: "landscape",
    });

    const response = await fetch(
        `https://api.unsplash.com/photos/random?${params}`,
        {
            headers: {
                Authorization: `Client-ID ${accessKey}`,
                "Accept-Version": "v1",
            },
        },
    );

    if (!response.ok) {
        if (response.status === 404) {
            return null;
        }
        const errorText = await response.text();
        throw new Error(`Unsplash API error: ${response.status} - ${errorText}`);
    }

    const photo: UnsplashApiPhoto = await response.json();
    return transformPhoto(photo);
}

export async function getPhotoById(id: string): Promise<UnsplashImage | null> {
    const accessKey = getAccessKey();

    const response = await fetch(`https://api.unsplash.com/photos/${id}`, {
        headers: {
            Authorization: `Client-ID ${accessKey}`,
            "Accept-Version": "v1",
        },
    });

    if (!response.ok) {
        if (response.status === 404) {
            return null;
        }
        const errorText = await response.text();
        throw new Error(`Unsplash API error: ${response.status} - ${errorText}`);
    }

    const photo: UnsplashApiPhoto = await response.json();
    return transformPhoto(photo);
}

export async function triggerDownload(downloadUrl: string): Promise<void> {
    const accessKey = getAccessKey();

    await fetch(downloadUrl, {
        headers: {
            Authorization: `Client-ID ${accessKey}`,
        },
    });
}

export function getAttributionHtml(image: UnsplashImage): string {
    return `Photo by <a href="${image.photographerUrl}?utm_source=swiftware&utm_medium=referral">${image.photographer}</a> on <a href="https://unsplash.com/?utm_source=swiftware&utm_medium=referral">Unsplash</a>`;
}

export function getAttributionMarkdown(image: UnsplashImage): string {
    return `Photo by [${image.photographer}](${image.photographerUrl}?utm_source=swiftware&utm_medium=referral) on [Unsplash](https://unsplash.com/?utm_source=swiftware&utm_medium=referral)`;
}
