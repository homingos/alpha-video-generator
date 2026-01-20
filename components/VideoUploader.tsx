'use client';

import { useCallback } from 'react';

interface VideoUploaderProps {
    onVideoSelect: (file: File) => void;
    disabled?: boolean;
}

export default function VideoUploader({ onVideoSelect, disabled = false }: VideoUploaderProps) {
    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('video/')) {
                    onVideoSelect(file);
                }
            }
        },
        [onVideoSelect]
    );

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('video/')) {
                    onVideoSelect(file);
                }
            }
        },
        [onVideoSelect]
    );

    return (
        <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`
        relative border-2 border-dashed rounded-2xl p-12 text-center
        transition-all duration-300 ease-out
        ${disabled
                    ? 'border-gray-600 bg-gray-800/30 cursor-not-allowed opacity-50'
                    : 'border-purple-500/50 bg-gradient-to-br from-purple-900/20 to-indigo-900/20 hover:border-purple-400 hover:bg-purple-900/30 cursor-pointer'
                }
      `}
        >
            <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleFileInput}
                disabled={disabled}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />

            <div className="space-y-4">
                {/* Upload Icon */}
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                    <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                    </svg>
                </div>

                <div>
                    <p className="text-xl font-semibold text-white mb-2">
                        Drop your video here
                    </p>
                    <p className="text-gray-400">
                        or click to browse files
                    </p>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <span className="px-2 py-1 rounded bg-gray-800">MP4</span>
                    <span className="px-2 py-1 rounded bg-gray-800">WebM</span>
                    <span className="px-2 py-1 rounded bg-gray-800">MOV</span>
                </div>
            </div>
        </div>
    );
}
