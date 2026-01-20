/**
 * FFmpeg WASM-based Video Processor
 * Uses FFmpeg's chromakey filter for professional green/blue screen removal
 */

export interface ChromaKeySettings {
    color: string;         // Hex color to remove (e.g., '00FF00' for green)
    similarity: number;    // 0.01 to 1.0 - higher = more colors matched
    blend: number;         // 0.0 to 1.0 - edge blending
}

/**
 * Default settings for green screen
 * Lower similarity = more precise matching (only pure green)
 * Higher similarity = matches more greenish colors (can cause spill issues)
 */
export const GREEN_SCREEN_SETTINGS: ChromaKeySettings = {
    color: '00FF00',
    similarity: 0.25,   // Lower = more precise, avoids green spill on clothes
    blend: 0.1,        // Slight blend for smoother edges
};

/**
 * Default settings for blue screen
 */
export const BLUE_SCREEN_SETTINGS: ChromaKeySettings = {
    color: '0000FF',
    similarity: 0.3,
    blend: 0.1,
};

/**
 * FFmpeg Video Processor
 * Creates a fresh FFmpeg instance for each processing to avoid memory issues
 */
export class FFmpegProcessor {

    /**
     * Process video to remove chroma key color
     * Creates a fresh FFmpeg instance each time to avoid memory corruption
     */
    async processVideo(
        inputFile: File,
        colorType: 'green' | 'blue',
        onProgress?: (progress: number, phase: string) => void
    ): Promise<{ mask: Blob; result: Blob }> {

        // Import FFmpeg dynamically
        const { FFmpeg } = await import('@ffmpeg/ffmpeg');
        const { toBlobURL, fetchFile } = await import('@ffmpeg/util');

        // Create a FRESH instance for each processing
        const ffmpeg = new FFmpeg();

        ffmpeg.on('log', ({ message }: { message: string }) => {
            console.log('[FFmpeg]', message);
        });

        ffmpeg.on('progress', ({ progress }: { progress: number }) => {
            // Map FFmpeg progress to our phases
            const currentProgress = 30 + Math.round(progress * 50);
            onProgress?.(currentProgress, 'Processing...');
        });

        // Load FFmpeg
        onProgress?.(5, 'Loading FFmpeg...');
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });

        onProgress?.(15, 'FFmpeg loaded');

        const settings = colorType === 'green' ? GREEN_SCREEN_SETTINGS : BLUE_SCREEN_SETTINGS;
        const inputName = 'input.mp4';
        const maskOutput = 'mask.webm';
        const resultOutput = 'result.webm';

        const chromakeyFilter = `chromakey=${settings.color}:${settings.similarity}:${settings.blend}`;

        // Write input file
        onProgress?.(20, 'Loading video...');
        await ffmpeg.writeFile(inputName, await fetchFile(inputFile));

        // // Generate mask video (green = black, subject = white)
        // onProgress?.(30, 'Generating mask...');
        // await ffmpeg.exec([
        //     '-i', inputName,
        //     '-vf', `${chromakeyFilter},alphaextract`,
        //     '-pix_fmt', 'yuv420p',
        //     '-c:v', 'libvpx-vp9',
        //     '-crf', '30',
        //     '-b:v', '0',
        //     '-an',
        //     '-y',
        //     maskOutput
        // ]);

        // // Generate result video with transparent background  
        // onProgress?.(60, 'Removing background...');
        // await ffmpeg.exec([
        //     '-i', inputName,
        //     '-vf', chromakeyFilter,
        //     '-c:v', 'libvpx-vp9',
        //     '-pix_fmt', 'yuva420p',
        //     '-crf', '30',
        //     '-b:v', '0',
        //     '-an',
        //     '-preset', 'ultrafast',
        //     '-y',
        //     resultOutput
        // ]);

        // Generate mask video (black = transparent/removed, white = visible/subject)
        // Uses threshold to create binary mask instead of greyscale
        onProgress?.(30, 'Generating mask...');
        await ffmpeg.exec([
            '-i', inputName,
            '-vf', `${chromakeyFilter},format=yuva420p,alphaextract,geq=lum='if(gt(lum(X,Y),128),255,0)',format=yuv420p`,
            '-c:v', 'libvpx',
            '-crf', '30',
            '-b:v', '1M',
            '-an',
            '-y',
            maskOutput
        ]);

        // Generate result video with transparent background  
        // Using PNG sequence approach since VP8/VP9 alpha has issues in WASM
        onProgress?.(60, 'Removing background...');
        await ffmpeg.exec([
            '-i', inputName,
            '-vf', `${chromakeyFilter},format=rgba`,
            '-c:v', 'libvpx',
            '-pix_fmt', 'yuva420p',
            '-auto-alt-ref', '0',  // Required for alpha channel in VP8
            '-crf', '30',
            '-b:v', '2M',
            '-an',
            '-y',
            resultOutput
        ]);

        // Read output files
        onProgress?.(90, 'Reading output...');
        const maskData = await ffmpeg.readFile(maskOutput) as Uint8Array;
        const resultData = await ffmpeg.readFile(resultOutput) as Uint8Array;

        // Clean up and terminate
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(maskOutput);
        await ffmpeg.deleteFile(resultOutput);

        // Terminate the instance to free memory
        ffmpeg.terminate();

        onProgress?.(100, 'Complete!');

        return {
            mask: new Blob([maskData], { type: 'video/webm' }),
            result: new Blob([resultData], { type: 'video/webm' }),
        };
    }
}

/**
 * Get a processor instance (creates new one each time for safety)
 */
export function getFFmpegProcessor(): FFmpegProcessor {
    return new FFmpegProcessor();
}
