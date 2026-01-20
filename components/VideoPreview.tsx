'use client';

import { useEffect, useRef } from 'react';

interface VideoPreviewProps {
    videoUrl: string;
    onVideoReady: (video: HTMLVideoElement) => void;
}

export default function VideoPreview({ videoUrl, onVideoReady }: VideoPreviewProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            const video = videoRef.current;

            const handleLoadedMetadata = () => {
                onVideoReady(video);
            };

            video.addEventListener('loadedmetadata', handleLoadedMetadata);

            return () => {
                video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            };
        }
    }, [videoUrl, onVideoReady]);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <h3 className="text-lg font-semibold text-white">Original Video</h3>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-black/50 border border-gray-700">
                <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    className="w-full max-h-[400px] object-contain"
                    crossOrigin="anonymous"
                >
                    Your browser does not support the video tag.
                </video>

                {/* Gradient overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
            </div>
        </div>
    );
}
