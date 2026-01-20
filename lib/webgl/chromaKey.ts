/**
 * WebGL-based Chroma Key Processor using HSV Color Space
 * Features: HSV matching, wide hue range, edge smoothness, spill suppression
 */

import {
    vertexShaderSource,
    maskFragmentShader,
    blackBgFragmentShader,
    createShader,
    createProgram
} from './shaders';

export interface ChromaKeySettings {
    hueTarget: number;        // 120 for green, 240 for blue (degrees)
    hueRange: number;         // Hue tolerance in degrees (wider = catch more)
    satMin: number;           // Minimum saturation (0-1)
    valMin: number;           // Minimum value/brightness (0-1)
    valMax: number;           // Maximum value/brightness (0-1)
    smoothness: number;       // Edge smoothness (0-1)
    spillSuppression: number; // Spill removal strength (0-1)
}

export interface ProcessingResult {
    mask: ImageData;
    black: ImageData;
}

/**
 * Optimized settings for green screen - WIDE RANGE to catch all greens
 */
export const GREEN_SCREEN_SETTINGS: ChromaKeySettings = {
    hueTarget: 120,         // Green hue center
    hueRange: 80,           // Wide range: 80-160 degrees catches lime to teal
    satMin: 0.15,           // Low saturation threshold
    valMin: 0.1,            // Catch dark greens
    valMax: 0.98,           // Catch bright greens
    smoothness: 0.12,       // Moderate edge smoothness
    spillSuppression: 0.7,  // Strong spill removal
};

/**
 * Optimized settings for blue screen
 */
export const BLUE_SCREEN_SETTINGS: ChromaKeySettings = {
    hueTarget: 240,
    hueRange: 80,
    satMin: 0.15,
    valMin: 0.1,
    valMax: 0.98,
    smoothness: 0.12,
    spillSuppression: 0.7,
};

/**
 * WebGL Chroma Key Processor
 */
export class ChromaKeyProcessor {
    private canvas: HTMLCanvasElement;
    private gl: WebGLRenderingContext;
    private maskProgram: WebGLProgram;
    private blackBgProgram: WebGLProgram;
    private positionBuffer: WebGLBuffer;
    private texCoordBuffer: WebGLBuffer;
    private texture: WebGLTexture;
    private width: number;
    private height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;

        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;

        const gl = this.canvas.getContext('webgl', {
            preserveDrawingBuffer: true,
            premultipliedAlpha: false,
        });

        if (!gl) throw new Error('WebGL not supported');
        this.gl = gl;

        // Create mask program
        const maskVS = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const maskFS = createShader(gl, gl.FRAGMENT_SHADER, maskFragmentShader);
        if (!maskVS || !maskFS) throw new Error('Failed to create mask shaders');
        const maskProg = createProgram(gl, maskVS, maskFS);
        if (!maskProg) throw new Error('Failed to create mask program');
        this.maskProgram = maskProg;

        // Create black bg program
        const blackVS = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const blackFS = createShader(gl, gl.FRAGMENT_SHADER, blackBgFragmentShader);
        if (!blackVS || !blackFS) throw new Error('Failed to create black bg shaders');
        const blackProg = createProgram(gl, blackVS, blackFS);
        if (!blackProg) throw new Error('Failed to create black bg program');
        this.blackBgProgram = blackProg;

        // Position buffer
        const positionBuffer = gl.createBuffer();
        if (!positionBuffer) throw new Error('Failed to create position buffer');
        this.positionBuffer = positionBuffer;
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1
        ]), gl.STATIC_DRAW);

        // Texture coordinate buffer
        const texCoordBuffer = gl.createBuffer();
        if (!texCoordBuffer) throw new Error('Failed to create texCoord buffer');
        this.texCoordBuffer = texCoordBuffer;
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0
        ]), gl.STATIC_DRAW);

        // Texture
        const texture = gl.createTexture();
        if (!texture) throw new Error('Failed to create texture');
        this.texture = texture;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.viewport(0, 0, width, height);
    }

    private renderWithProgram(
        program: WebGLProgram,
        imageData: ImageData,
        settings: ChromaKeySettings
    ): ImageData {
        const { gl } = this;

        gl.useProgram(program);

        // Upload texture
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);

        // Position attribute
        const posLoc = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        // TexCoord attribute
        const texLoc = gl.getAttribLocation(program, 'a_texCoord');
        gl.enableVertexAttribArray(texLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

        // Set all uniforms
        gl.uniform1f(gl.getUniformLocation(program, 'u_hueTarget'), settings.hueTarget);
        gl.uniform1f(gl.getUniformLocation(program, 'u_hueRange'), settings.hueRange);
        gl.uniform1f(gl.getUniformLocation(program, 'u_satMin'), settings.satMin);
        gl.uniform1f(gl.getUniformLocation(program, 'u_valMin'), settings.valMin);
        gl.uniform1f(gl.getUniformLocation(program, 'u_valMax'), settings.valMax);
        gl.uniform1f(gl.getUniformLocation(program, 'u_smoothness'), settings.smoothness);

        const spillLoc = gl.getUniformLocation(program, 'u_spillSuppression');
        if (spillLoc) gl.uniform1f(spillLoc, settings.spillSuppression);

        // Render
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // Read pixels
        const output = new Uint8ClampedArray(this.width * this.height * 4);
        gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.UNSIGNED_BYTE, output);

        // Flip Y
        const flipped = new Uint8ClampedArray(output.length);
        const rowSize = this.width * 4;
        for (let y = 0; y < this.height; y++) {
            const srcRow = (this.height - 1 - y) * rowSize;
            const dstRow = y * rowSize;
            flipped.set(output.subarray(srcRow, srcRow + rowSize), dstRow);
        }

        return new ImageData(flipped, this.width, this.height);
    }

    processFrameAll(imageData: ImageData, settings: ChromaKeySettings): ProcessingResult {
        const mask = this.renderWithProgram(this.maskProgram, imageData, settings);
        const black = this.renderWithProgram(this.blackBgProgram, imageData, settings);
        return { mask, black };
    }

    destroy(): void {
        const { gl } = this;
        gl.deleteBuffer(this.positionBuffer);
        gl.deleteBuffer(this.texCoordBuffer);
        gl.deleteTexture(this.texture);
        gl.deleteProgram(this.maskProgram);
        gl.deleteProgram(this.blackBgProgram);
    }
}
