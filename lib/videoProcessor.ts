import { ChromaKeyProcessor, ChromaKeySettings, GREEN_SCREEN_SETTINGS, BLUE_SCREEN_SETTINGS, ProcessingResult } from './webgl/chromaKey';

export interface ProcessingCallbacks {
    onProgress: (current: number, total: number) => void;
    onComplete: (results: ProcessedVideos) => void;
    onError: (error: Error) => void;
}

/**
 * Processed video outputs
 */
export interface ProcessedVideos {
    mask: Blob;   // Black where key color, white elsewhere
    black: Blob;  // Black background with spill suppression
}

/**
 * Video Processor - handles frame extraction, WebGL processing, and video reassembly
 */
export class VideoProcessor {
    private fps: number;
    private processor: ChromaKeyProcessor | null = null;

    constructor(fps: number = 30) {
        this.fps = fps;
    }

    /**
     * Extract all frames from a video at the specified FPS
     */
    async extractFrames(
        videoElement: HTMLVideoElement,
        onProgress?: (current: number, total: number) => void
    ): Promise<ImageData[]> {
        const frames: ImageData[] = [];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('Failed to get canvas context');
        }

        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        const duration = videoElement.duration;
        const totalFrames = Math.floor(duration * this.fps);
        const frameInterval = 1 / this.fps;

        for (let i = 0; i < totalFrames; i++) {
            const time = i * frameInterval;
            await this.seekToTime(videoElement, time);
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            frames.push(imageData);

            if (onProgress) {
                onProgress(i + 1, totalFrames);
            }
        }

        return frames;
    }

    /**
     * Seek video to a specific time
     */
    private seekToTime(video: HTMLVideoElement, time: number): Promise<void> {
        return new Promise((resolve) => {
            const handleSeeked = () => {
                video.removeEventListener('seeked', handleSeeked);
                resolve();
            };
            video.addEventListener('seeked', handleSeeked);
            video.currentTime = time;
        });
    }

    /**
     * Process all frames using WebGL with HSL, similarity, smoothness, and spill suppression
     */
    async processFrames(
        frames: ImageData[],
        colorType: 'green' | 'blue',
        onProgress?: (current: number, total: number) => void
    ): Promise<{ mask: ImageData[]; black: ImageData[] }> {
        if (frames.length === 0) {
            return { mask: [], black: [] };
        }

        const { width, height } = frames[0];
        this.processor = new ChromaKeyProcessor(width, height);

        const settings: ChromaKeySettings = colorType === 'green'
            ? GREEN_SCREEN_SETTINGS
            : BLUE_SCREEN_SETTINGS;

        const maskFrames: ImageData[] = [];
        const blackFrames: ImageData[] = [];

        for (let i = 0; i < frames.length; i++) {
            const result: ProcessingResult = this.processor.processFrameAll(frames[i], settings);
            maskFrames.push(result.mask);
            blackFrames.push(result.black);

            if (onProgress) {
                onProgress(i + 1, frames.length);
            }

            // Yield to prevent UI blocking
            if (i % 5 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        this.processor.destroy();
        this.processor = null;

        return { mask: maskFrames, black: blackFrames };
    }

    /**
     * Create a video blob from frames using canvas recording
     * Uses deterministic timing to ensure consistent video duration
     */
    async createVideo(
        frames: ImageData[],
        onProgress?: (current: number, total: number) => void
    ): Promise<Blob> {
        if (frames.length === 0) {
            throw new Error('No frames to process');
        }

        const { width, height } = frames[0];
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('Failed to get canvas context');
        }

        // Use a fixed frame rate capture stream
        const stream = canvas.captureStream(0); // 0 = manual frame capture
        const videoTrack = stream.getVideoTracks()[0];

        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 5000000,
        });

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
            }
        };

        return new Promise((resolve, reject) => {
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                resolve(blob);
            };

            mediaRecorder.onerror = () => {
                reject(new Error('MediaRecorder error'));
            };

            mediaRecorder.start();

            const frameInterval = 1000 / this.fps;
            let frameIndex = 0;
            let startTime = performance.now();
            let nextFrameTime = startTime;

            const drawNextFrame = () => {
                if (frameIndex >= frames.length) {
                    // Wait a bit before stopping to ensure all frames are captured
                    setTimeout(() => {
                        mediaRecorder.stop();
                    }, 100);
                    return;
                }

                const now = performance.now();

                // Draw frame
                ctx.putImageData(frames[frameIndex], 0, 0);

                // Request a frame capture from the stream
                if ('requestFrame' in videoTrack) {
                    (videoTrack as any).requestFrame();
                }

                if (onProgress) {
                    onProgress(frameIndex + 1, frames.length);
                }

                frameIndex++;
                nextFrameTime += frameInterval;

                // Calculate delay to next frame (compensate for processing time)
                const delay = Math.max(0, nextFrameTime - performance.now());
                setTimeout(drawNextFrame, delay);
            };

            // Start drawing frames
            drawNextFrame();
        });
    }
}
