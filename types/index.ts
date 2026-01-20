export interface RGB {
    r: number;
    g: number;
    b: number;
}

export interface HSL {
    h: number;
    s: number;
    l: number;
}

export interface ProcessingStatus {
    isProcessing: boolean;
    currentFrame: number;
    totalFrames: number;
    progress: number;
}

export interface VideoState {
    originalFile: File | null;
    originalUrl: string | null;
    processedUrl: string | null;
    selectedColor: 'green' | 'blue';
    status: ProcessingStatus;
}
