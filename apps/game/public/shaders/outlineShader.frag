
precision mediump float;

uniform sampler2D uMainSampler;
uniform vec2 uTextureSize;
uniform vec4 uOutlineColor;

varying vec2 outTexCoord;

void main() {
    vec4 color = texture2D(uMainSampler, outTexCoord);

    // If the current pixel is not transparent, render it normally
    if (color.a > 0.0) {
        gl_FragColor = color;
        return;
    }

    // Check the immediate neighbors for any non-transparent pixel
    float outline = 0.0;

    // Offsets for immediate neighbors
    vec2 offsets[8];
    offsets[0] = vec2(-1.0,  0.0); // Left
    offsets[1] = vec2( 1.0,  0.0); // Right
    offsets[2] = vec2( 0.0, -1.0); // Top
    offsets[3] = vec2( 0.0,  1.0); // Bottom
    offsets[4] = vec2(-1.0, -1.0); // Top-left
    offsets[5] = vec2( 1.0, -1.0); // Top-right
    offsets[6] = vec2(-1.0,  1.0); // Bottom-left
    offsets[7] = vec2( 1.0,  1.0); // Bottom-right

    for (int i = 0; i < 8; i++) {
        vec2 offset = offsets[i] / uTextureSize;
        vec4 sample = texture2D(uMainSampler, outTexCoord + offset);
        outline = max(outline, sample.a);
    }

    // Render the outline if detected
    if (outline > 0.0) {
        gl_FragColor = uOutlineColor;
    } else {
        gl_FragColor = vec4(0.0);
    }
}

