import Image from "next/image";

interface ImageWithCaptionProps {
    src: string;
    alt: string;
    caption?: string;
    credit?: string;
    width?: number;
    height?: number;
}

export function ImageWithCaption({
    src,
    alt,
    caption,
    credit,
    width = 800,
    height = 400,
}: ImageWithCaptionProps) {
    const isExternal = src.startsWith("http://") || src.startsWith("https://");

    return (
        <figure className="my-6">
            {isExternal ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={src}
                    alt={alt}
                    className="w-full rounded-lg"
                    loading="lazy"
                />
            ) : (
                <Image
                    src={src}
                    alt={alt}
                    width={width}
                    height={height}
                    className="w-full rounded-lg"
                />
            )}
            {(caption || credit) && (
                <figcaption className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                    {caption}
                    {credit && (
                        <span className="block text-xs mt-1 italic">{credit}</span>
                    )}
                </figcaption>
            )}
        </figure>
    );
}
