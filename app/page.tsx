'use client';

import { useState, useCallback, useRef } from 'react';
import VideoUploader from '@/components/VideoUploader';
import VideoPreview from '@/components/VideoPreview';
import ColorSelector from '@/components/ColorSelector';
import { getFFmpegProcessor } from '@/lib/ffmpegProcessor';

type AppState = 'upload' | 'preview' | 'processing' | 'complete';

interface ProcessedUrls {
  mask: string;
  result: string;
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>('upload');
  const [selectedColor, setSelectedColor] = useState<'green' | 'blue'>('green');
  const [originalVideoUrl, setOriginalVideoUrl] = useState<string | null>(null);
  const [processedUrls, setProcessedUrls] = useState<ProcessedUrls | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const inputFileRef = useRef<File | null>(null);
  const processedBlobsRef = useRef<{ mask: Blob; result: Blob } | null>(null);

  const handleVideoSelect = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setOriginalVideoUrl(url);
    inputFileRef.current = file;
    setAppState('preview');
  }, []);

  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video;
  }, []);

  const handleProcess = useCallback(async () => {
    if (!inputFileRef.current) return;

    setAppState('processing');
    setProgress(0);
    setStatusMessage('Initializing FFmpeg...');

    try {
      const processor = getFFmpegProcessor();

      const result = await processor.processVideo(
        inputFileRef.current,
        selectedColor,
        (prog, phase) => {
          setProgress(prog);
          setStatusMessage(phase);
        }
      );
      console.log(result);
      processedBlobsRef.current = result;

      setProcessedUrls({
        mask: URL.createObjectURL(result.mask),
        result: URL.createObjectURL(result.result),
      });

      setAppState('complete');
    } catch (error) {
      console.error('Processing error:', error);
      setStatusMessage('Error: ' + (error as Error).message);
      setTimeout(() => setAppState('preview'), 3000);
    }
  }, [selectedColor]);

  const handleDownload = useCallback((type: 'mask' | 'result') => {
    if (!processedBlobsRef.current) return;

    const blob = processedBlobsRef.current[type];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${type}-video-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const handleReset = useCallback(() => {
    if (originalVideoUrl) URL.revokeObjectURL(originalVideoUrl);
    if (processedUrls) {
      URL.revokeObjectURL(processedUrls.mask);
      URL.revokeObjectURL(processedUrls.result);
    }

    setOriginalVideoUrl(null);
    setProcessedUrls(null);
    setAppState('upload');
    videoRef.current = null;
    inputFileRef.current = null;
    processedBlobsRef.current = null;
  }, [originalVideoUrl, processedUrls]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-4">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm text-green-300">FFmpeg WASM Powered</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-indigo-200 bg-clip-text text-transparent mb-4">
            Video Background Remover
          </h1>
        </header>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Upload State */}
          {appState === 'upload' && (
            <VideoUploader onVideoSelect={handleVideoSelect} />
          )}

          {/* Preview State */}
          {appState === 'preview' && originalVideoUrl && (
            <div className="space-y-8">
              <VideoPreview
                videoUrl={originalVideoUrl}
                onVideoReady={handleVideoReady}
              />

              <ColorSelector
                selectedColor={selectedColor}
                onColorChange={setSelectedColor}
              />

              <button
                onClick={handleProcess}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold text-lg transition-all duration-300 shadow-lg shadow-green-500/25 flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Process with FFmpeg
              </button>
            </div>
          )}

          {/* Processing State */}
          {appState === 'processing' && (
            <div className="space-y-8">
              {originalVideoUrl && (
                <div className="rounded-xl overflow-hidden border border-gray-700 bg-black/50 opacity-50">
                  <video
                    src={originalVideoUrl}
                    className="w-full max-h-[300px] object-contain"
                    muted
                  />
                </div>
              )}

              <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                    <svg className="w-8 h-8 text-green-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{statusMessage}</h3>
                  <p className="text-gray-400">Processing video with FFmpeg WASM</p>
                </div>
              </div>
            </div>
          )}

          {/* Complete State */}
          {appState === 'complete' && processedUrls && (
            <div className="space-y-8">
              {/* Original Video */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Original Video</h3>
                <div className="rounded-xl overflow-hidden border border-gray-700 bg-black/50">
                  <video
                    src={originalVideoUrl!}
                    controls
                    className="w-full max-h-[300px] object-contain"
                  />
                </div>
              </div>

              {/* Processed outputs */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Mask Video */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Mask</h3>
                  </div>
                  <p className="text-xs text-gray-500">White = keep, Black = removed</p>
                  <div className="rounded-xl overflow-hidden border border-gray-700 bg-gray-900">
                    <video
                      src={processedUrls.mask}
                      controls
                      className="w-full h-[220px] object-contain"
                    />
                  </div>
                  <button
                    onClick={() => handleDownload('mask')}
                    className="w-full py-2 px-4 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Mask
                  </button>
                </div>

                {/* Result Video */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Result</h3>
                  </div>
                  <p className="text-xs text-gray-500">Background removed (transparent)</p>
                  <div
                    className="rounded-xl overflow-hidden border border-gray-700"
                    style={{
                      backgroundImage: `
                        linear-gradient(45deg, #2a2a3e 25%, transparent 25%),
                        linear-gradient(-45deg, #2a2a3e 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #2a2a3e 75%),
                        linear-gradient(-45deg, transparent 75%, #2a2a3e 75%)
                      `,
                      backgroundSize: '16px 16px',
                      backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                      backgroundColor: '#1a1a2e',
                    }}
                  >
                    <video
                      src={processedUrls.result}
                      controls
                      className="w-full h-[220px] object-contain"
                    />
                  </div>
                  <button
                    onClick={() => handleDownload('result')}
                    className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Result
                  </button>
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={handleReset}
                className="w-full py-3 px-6 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Process Another Video
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
