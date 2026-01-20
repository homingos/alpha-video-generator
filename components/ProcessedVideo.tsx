'use client';

interface ProcessedVideoProps {
    videoUrl: string;
    onDownload: () => void;
    onReset: () => void;
}

export default function ProcessedVideo({ videoUrl, onDownload, onReset }: ProcessedVideoProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"></div>
                    <h3 className="text-lg font-semibold text-white">Processed Video</h3>
                </div>
                <span className="text-sm text-green-400 bg-green-500/10 px-3 py-1 rounded-full">
                    ✓ Background Removed
                </span>
            </div>

            {/* Video Display with Checkerboard Background */}
            <div className="relative rounded-xl overflow-hidden border border-gray-700">
                {/* Checkerboard pattern to show transparency */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `
              linear-gradient(45deg, #1a1a2e 25%, transparent 25%),
              linear-gradient(-45deg, #1a1a2e 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #1a1a2e 75%),
              linear-gradient(-45deg, transparent 75%, #1a1a2e 75%)
            `,
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                        backgroundColor: '#0f0f23',
                    }}
                ></div>

                <video
                    src={videoUrl}
                    controls
                    className="relative w-full max-h-[400px] object-contain"
                >
                    Your browser does not support the video tag.
                </video>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
                <button
                    onClick={onDownload}
                    className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Video
                </button>

                <button
                    onClick={onReset}
                    className="py-3 px-6 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-all duration-300 flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Process Another
                </button>
            </div>
        </div>
    );
}
