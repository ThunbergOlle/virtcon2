import { createCanvas, Canvas } from 'canvas';
import { SpriteDefinition, Palette } from '../types/sprite-definition';
import { resolveComponents, ResolvedComponent } from '../parser/template-resolver';

interface PixelBuffer {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export function renderSprite(def: SpriteDefinition): Canvas {
  const [width, height] = def.meta.canvas;

  // Create a pixel buffer at native resolution
  const buffer = createPixelBuffer(width, height);

  // Resolve all components (expand templates)
  const components = resolveComponents(def);

  // Render each component to the pixel buffer
  for (const component of components) {
    renderComponent(buffer, component, def.palette, 0, 0);
  }

  // Create the canvas and put the pixel data onto it
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(width, height);
  imageData.data.set(buffer.data);
  ctx.putImageData(imageData, 0, 0);

  return canvas;
}

function createPixelBuffer(width: number, height: number): PixelBuffer {
  return {
    width,
    height,
    data: new Uint8ClampedArray(width * height * 4),
  };
}

function setPixel(buffer: PixelBuffer, x: number, y: number, r: number, g: number, b: number, a: number): void {
  // Bounds check
  if (x < 0 || x >= buffer.width || y < 0 || y >= buffer.height) {
    return;
  }

  const i = (y * buffer.width + x) * 4;
  buffer.data[i] = r;
  buffer.data[i + 1] = g;
  buffer.data[i + 2] = b;
  buffer.data[i + 3] = a;
}

function parseHexColor(hex: string): { r: number; g: number; b: number; a: number } | null {
  // Handle #RGB, #RGBA, #RRGGBB, #RRGGBBAA formats
  let r = 0,
    g = 0,
    b = 0,
    a = 255;

  if (hex.startsWith('#')) {
    hex = hex.slice(1);
  }

  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 4) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
    a = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else if (hex.length === 8) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
    a = parseInt(hex.slice(6, 8), 16);
  } else {
    return null;
  }

  if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) {
    return null;
  }

  return { r, g, b, a };
}

function renderComponent(
  buffer: PixelBuffer,
  component: ResolvedComponent,
  globalPalette: Palette,
  parentX: number,
  parentY: number
): void {
  // Calculate position with anchor offset
  const x = parentX + component.at[0] - component.anchor[0];
  const y = parentY + component.at[1] - component.anchor[1];

  // Render pattern
  if (component.pattern) {
    const mergedPalette = { ...globalPalette, ...component.palette };
    renderPattern(buffer, component.pattern, x, y, mergedPalette);
  }

  // Render children
  for (const child of component.children) {
    renderComponent(buffer, child, globalPalette, x, y);
  }
}

function renderPattern(buffer: PixelBuffer, pattern: string, x: number, y: number, palette: Palette): void {
  const rows = pattern.split('\n').filter((row) => row.length > 0);

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    let px = x;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];

      // Skip transparent/empty pixels
      if (char === '.' || char === ' ') {
        px++;
        continue;
      }

      // Look up color in palette
      const color = palette[char];
      if (color) {
        const parsed = parseHexColor(color);
        if (parsed) {
          setPixel(buffer, Math.floor(px), Math.floor(y + rowIndex), parsed.r, parsed.g, parsed.b, parsed.a);
        }
      }

      px++;
    }
  }
}
