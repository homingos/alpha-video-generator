'use client';

interface ProcessingStatusProps {
    currentFrame: number;
    totalFrames: number;
    phase: 'extracting' | 'processing' | 'encoding';
}

export default function ProcessingStatus({ currentFrame, totalFrames, phase }: ProcessingStatusProps) {
    const progress = totalFrames > 0 ? (currentFrame / totalFrames) * 100 : 0;

    const getPhaseInfo = () => {
        switch (phase) {
            case 'extracting':
                return {
                    label: 'Extracting Frames',
                    color: 'from-yellow-500 to-orange-500',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    ),
                };
            case 'processing':
                return {
                    label: 'Removing Background',
                    color: 'from-purple-500 to-pink-500',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                    ),
                };
            case 'encoding':
                return {
                    label: 'Encoding Video',
                    color: 'from-green-500 to-emerald-500',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    ),
                };
        }
    };

    const phaseInfo = getPhaseInfo();

    return (
        <div className="space-y-4 p-6 rounded-xl bg-gray-800/50 border border-gray-700">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${phaseInfo.color} text-white`}>
                        {phaseInfo.icon}
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">{phaseInfo.label}</h3>
                        <p className="text-sm text-gray-400">
                            Frame {currentFrame} of {totalFrames}
                        </p>
                    </div>
                </div>
                <span className="text-2xl font-bold text-white">{Math.round(progress)}%</span>
            </div>

            {/* Progress Bar */}
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                    className={`h-full bg-gradient-to-r ${phaseInfo.color} transition-all duration-300 ease-out`}
                    style={{ width: `${progress}%` }}
                >
                    <div className="h-full w-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-shimmer"></div>
                </div>
            </div>

            {/* Processing Animation */}
            <div className="flex justify-center gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={`w-2 h-2 rounded-full bg-gradient-to-br ${phaseInfo.color} animate-bounce`}
                        style={{ animationDelay: `${i * 100}ms` }}
                    ></div>
                ))}
            </div>
        </div>
    );
}
