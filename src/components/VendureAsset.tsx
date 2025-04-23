import { useState, useEffect } from 'react';
import Image from 'next/image';

interface VendureAssetProps {
    preview: string;
    source?: string;
    preset?: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
}

export const VendureAsset: React.FC<VendureAssetProps> = ({ preview, source, preset = 'medium', alt, width = 300, height = 300, className = '' }) => {
    const [imageUrl, setImageUrl] = useState<string>(preview);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        if (source) {
            setImageUrl(source);
        } else {
            if (!preview) {
                setError(true);
                return;
            }

            try {
                const url = new URL(preview);
                url.searchParams.set('preset', preset);
                url.searchParams.set('format', 'jpg');
                setImageUrl(url.toString());
            } catch (err) {
                console.error('Error generating image URL:', err);
                setError(true);
            }
        }
    }, [preview, preset, source]);

    if (error || !imageUrl) {
        return (
            <div className={`bg-gray-100 flex items-center justify-center ${className}`} style={{ width, height }}>
                <span className="text-gray-400">Không thể tải hình ảnh</span>
            </div>
        );
    }

    return (
        <div className={`relative aspect-square ${className}`}>
            <Image
                src={imageUrl}
                alt={alt}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                onError={() => setError(true)}
                priority
            />
        </div>
    );
}; 