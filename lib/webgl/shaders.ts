// Professional Chroma Key Shaders using HSV Color Space
// HSV is better for chroma keying as Value represents brightness more intuitively

export const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

// Fragment shader for MASK output using HSV
export const maskFragmentShader = `
  precision highp float;
  
  uniform sampler2D u_texture;
  uniform float u_hueTarget;      // Target hue (0-360), 120 for green, 240 for blue
  uniform float u_hueRange;       // Hue tolerance (degrees)
  uniform float u_satMin;         // Minimum saturation
  uniform float u_valMin;         // Minimum value
  uniform float u_valMax;         // Maximum value
  uniform float u_smoothness;     // Edge smoothness
  
  varying vec2 v_texCoord;
  
  // RGB to HSV conversion (more accurate for chroma keying)
  vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(
      abs(q.z + (q.w - q.y) / (6.0 * d + e)),  // H (0-1)
      d / (q.x + e),                            // S (0-1)
      q.x                                       // V (0-1)
    );
  }
  
  void main() {
    vec4 color = texture2D(u_texture, v_texCoord);
    vec3 hsv = rgb2hsv(color.rgb);
    
    float hue = hsv.x * 360.0;  // Convert to degrees
    float sat = hsv.y;
    float val = hsv.z;
    
    // Calculate hue difference (handle wraparound at 360)
    float hueDiff = abs(hue - u_hueTarget);
    if (hueDiff > 180.0) hueDiff = 360.0 - hueDiff;
    
    // Check if pixel is within key color range
    float hueMatch = 1.0 - smoothstep(u_hueRange * 0.5, u_hueRange, hueDiff);
    float satMatch = smoothstep(u_satMin * 0.5, u_satMin, sat);
    float valMatch = step(u_valMin, val) * step(val, u_valMax);
    
    // Additional check: green/blue channel dominance
    float dominance = 0.0;
    if (u_hueTarget < 180.0) {
      // Green screen - green must be dominant
      dominance = smoothstep(0.0, 0.1, color.g - max(color.r, color.b));
    } else {
      // Blue screen - blue must be dominant
      dominance = smoothstep(0.0, 0.1, color.b - max(color.r, color.g));
    }
    
    // Combine all factors
    float keyStrength = hueMatch * satMatch * valMatch * dominance;
    
    // Apply smoothness for anti-aliased edges
    float alpha = 1.0 - smoothstep(0.3 - u_smoothness, 0.3 + u_smoothness, keyStrength);
    
    // Mask: white = keep, black = remove
    gl_FragColor = vec4(vec3(alpha), 1.0);
  }
`;

// Fragment shader for BLACK BACKGROUND output with spill suppression
export const blackBgFragmentShader = `
  precision highp float;
  
  uniform sampler2D u_texture;
  uniform float u_hueTarget;
  uniform float u_hueRange;
  uniform float u_satMin;
  uniform float u_valMin;
  uniform float u_valMax;
  uniform float u_smoothness;
  uniform float u_spillSuppression;
  
  varying vec2 v_texCoord;
  
  vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
  }
  
  // Spill suppression - removes color cast from edges
  vec3 suppressSpill(vec3 color, float amount, bool isGreen) {
    vec3 result = color;
    if (isGreen) {
      float avg = (color.r + color.b) * 0.5;
      float excess = max(0.0, color.g - avg);
      result.g -= excess * amount;
      // Shift toward magenta slightly to compensate
      result.r = min(1.0, result.r + excess * amount * 0.2);
      result.b = min(1.0, result.b + excess * amount * 0.2);
    } else {
      float avg = (color.r + color.g) * 0.5;
      float excess = max(0.0, color.b - avg);
      result.b -= excess * amount;
      result.r = min(1.0, result.r + excess * amount * 0.2);
      result.g = min(1.0, result.g + excess * amount * 0.2);
    }
    return result;
  }
  
  void main() {
    vec4 color = texture2D(u_texture, v_texCoord);
    vec3 hsv = rgb2hsv(color.rgb);
    
    float hue = hsv.x * 360.0;
    float sat = hsv.y;
    float val = hsv.z;
    
    float hueDiff = abs(hue - u_hueTarget);
    if (hueDiff > 180.0) hueDiff = 360.0 - hueDiff;
    
    float hueMatch = 1.0 - smoothstep(u_hueRange * 0.5, u_hueRange, hueDiff);
    float satMatch = smoothstep(u_satMin * 0.5, u_satMin, sat);
    float valMatch = step(u_valMin, val) * step(val, u_valMax);
    
    float dominance = 0.0;
    bool isGreen = u_hueTarget < 180.0;
    if (isGreen) {
      dominance = smoothstep(0.0, 0.1, color.g - max(color.r, color.b));
    } else {
      dominance = smoothstep(0.0, 0.1, color.b - max(color.r, color.g));
    }
    
    float keyStrength = hueMatch * satMatch * valMatch * dominance;
    float alpha = 1.0 - smoothstep(0.3 - u_smoothness, 0.3 + u_smoothness, keyStrength);
    
    // Apply spill suppression to non-key pixels (stronger near edges)
    float spillStrength = u_spillSuppression * (1.0 - alpha * 0.5);
    vec3 despilled = suppressSpill(color.rgb, spillStrength, isGreen);
    
    // Blend with black background
    vec3 finalColor = despilled * alpha;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

/**
 * Create and compile a shader
 */
export function createShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string
): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

/**
 * Create a WebGL program
 */
export function createProgram(
    gl: WebGLRenderingContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
): WebGLProgram | null {
    const program = gl.createProgram();
    if (!program) return null;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }

    return program;
}
