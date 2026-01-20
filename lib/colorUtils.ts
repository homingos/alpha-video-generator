import { RGB, HSL } from '@/types';

/**
 * Convert RGB to HSL color space
 */
export function rgbToHsl(rgb: RGB): HSL {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                break;
            case g:
                h = ((b - r) / d + 2) / 6;
                break;
            case b:
                h = ((r - g) / d + 4) / 6;
                break;
        }
    }

    return {
        h: h * 360,
        s: s * 100,
        l: l * 100,
    };
}

/**
 * Convert HSL to RGB color space
 */
export function hslToRgb(hsl: HSL): RGB {
    const h = hsl.h / 360;
    const s = hsl.s / 100;
    const l = hsl.l / 100;

    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255),
    };
}

/**
 * Generate ±14 color variations from a base color
 * Creates variations by adjusting hue, saturation, and lightness
 */
export function generateColorMap(baseColor: RGB): RGB[] {
    const baseHsl = rgbToHsl(baseColor);
    const colors: RGB[] = [baseColor];

    // Generate 14 variations in each direction (lighter/darker, hue shifts)
    for (let i = 1; i <= 14; i++) {
        // Lighter variations - increase lightness
        const lighterHsl: HSL = {
            h: baseHsl.h,
            s: Math.max(0, baseHsl.s - i * 2),
            l: Math.min(100, baseHsl.l + i * 3),
        };
        colors.push(hslToRgb(lighterHsl));

        // Darker variations - decrease lightness
        const darkerHsl: HSL = {
            h: baseHsl.h,
            s: Math.min(100, baseHsl.s + i * 1),
            l: Math.max(0, baseHsl.l - i * 3),
        };
        colors.push(hslToRgb(darkerHsl));
    }

    // Add hue variations for more comprehensive coverage
    for (let i = 1; i <= 7; i++) {
        // Hue shift positive
        const hueShiftPos: HSL = {
            h: (baseHsl.h + i * 3) % 360,
            s: baseHsl.s,
            l: baseHsl.l,
        };
        colors.push(hslToRgb(hueShiftPos));

        // Hue shift negative
        const hueShiftNeg: HSL = {
            h: (baseHsl.h - i * 3 + 360) % 360,
            s: baseHsl.s,
            l: baseHsl.l,
        };
        colors.push(hslToRgb(hueShiftNeg));
    }

    return colors;
}

/**
 * Preset colors for green/blue screen
 * These are calibrated for common chroma key backgrounds
 */
export const PRESET_COLORS: Record<'green' | 'blue', RGB> = {
    green: { r: 0, g: 255, b: 0 },   // Pure bright green (most common)
    blue: { r: 0, g: 0, b: 255 },    // Pure bright blue
};

/**
 * Calculate color distance in RGB space
 */
export function colorDistance(c1: RGB, c2: RGB): number {
    return Math.sqrt(
        Math.pow(c1.r - c2.r, 2) +
        Math.pow(c1.g - c2.g, 2) +
        Math.pow(c1.b - c2.b, 2)
    );
}

/**
 * Check if a color matches any color in the color map within tolerance
 */
export function isColorInMap(color: RGB, colorMap: RGB[], tolerance: number = 50): boolean {
    return colorMap.some(mapColor => colorDistance(color, mapColor) < tolerance);
}
