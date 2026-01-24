import { loadImage, createCanvas } from 'canvas';
import * as fs from 'fs';
import * as yaml from 'yaml';
import * as path from 'path';

export interface ExtractedSprite {
  meta: {
    name: string;
    canvas: [number, number];
  };
  palette: Record<string, string>;
  components: {
    sprite: {
      at: [number, number];
      pattern: string;
    };
  };
}

export interface CompareResult {
  match: boolean;
  differences: Array<{
    x: number;
    y: number;
    original: { hex: string; alpha: number };
    generated: { hex: string; alpha: number };
  }>;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
}

export async function extractPixels(
  imagePath: string
): Promise<{ width: number; height: number; pixels: Array<{ x: number; y: number; hex: string; alpha: number }> }> {
  const img = await loadImage(imagePath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imageData.data;

  const pixels: Array<{ x: number; y: number; hex: string; alpha: number }> = [];

  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const idx = (img.width * y + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      if (a > 0) {
        pixels.push({ x, y, hex: rgbToHex(r, g, b), alpha: a });
      }
    }
  }

  return { width: img.width, height: img.height, pixels };
}

export async function pngToYaml(imagePath: string, spriteName?: string): Promise<ExtractedSprite> {
  const { width, height, pixels } = await extractPixels(imagePath);

  // Build palette from unique colors
  const uniqueColors = [...new Set(pixels.map((p) => p.hex))];
  const palette: Record<string, string> = {};
  const colorToKey: Record<string, string> = {};

  // Use single characters for palette keys (1-9, then a-z)
  const keys = '123456789abcdefghijklmnopqrstuvwxyz';
  uniqueColors.forEach((color, idx) => {
    const key = keys[idx] || String(idx + 1);
    palette[key] = color;
    colorToKey[color] = key;
  });

  // Build pattern
  const rows: string[] = [];
  for (let y = 0; y < height; y++) {
    let row = '';
    for (let x = 0; x < width; x++) {
      const pixel = pixels.find((p) => p.x === x && p.y === y);
      if (pixel) {
        row += colorToKey[pixel.hex];
      } else {
        row += '.';
      }
    }
    rows.push(row);
  }

  const name = spriteName || path.basename(imagePath, path.extname(imagePath));

  return {
    meta: {
      name,
      canvas: [width, height],
    },
    palette,
    components: {
      sprite: {
        at: [0, 0],
        pattern: rows.join('\n'),
      },
    },
  };
}

export function spriteToYamlString(sprite: ExtractedSprite): string {
  // Custom formatting to match expected output style
  let output = `meta:\n`;
  output += `  name: ${sprite.meta.name}\n`;
  output += `  canvas: [${sprite.meta.canvas[0]}, ${sprite.meta.canvas[1]}]\n\n`;

  output += `palette:\n`;
  for (const [key, color] of Object.entries(sprite.palette)) {
    output += `  "${key}": "${color}"\n`;
  }

  output += `\ncomponents:\n`;
  output += `  sprite:\n`;
  output += `    at: [0, 0]\n`;
  output += `    pattern: |\n`;

  const lines = sprite.components.sprite.pattern.split('\n');
  for (const line of lines) {
    output += `      ${line}\n`;
  }

  return output;
}

export async function compareImages(imagePath1: string, imagePath2: string): Promise<CompareResult> {
  const [img1Data, img2Data] = await Promise.all([extractPixels(imagePath1), extractPixels(imagePath2)]);

  if (img1Data.width !== img2Data.width || img1Data.height !== img2Data.height) {
    return {
      match: false,
      differences: [
        {
          x: -1,
          y: -1,
          original: { hex: `${img1Data.width}x${img1Data.height}`, alpha: 255 },
          generated: { hex: `${img2Data.width}x${img2Data.height}`, alpha: 255 },
        },
      ],
    };
  }

  const differences: CompareResult['differences'] = [];

  // Create lookup maps for faster comparison
  const pixels1Map = new Map<string, { hex: string; alpha: number }>();
  const pixels2Map = new Map<string, { hex: string; alpha: number }>();

  for (const p of img1Data.pixels) {
    pixels1Map.set(`${p.x},${p.y}`, { hex: p.hex, alpha: p.alpha });
  }
  for (const p of img2Data.pixels) {
    pixels2Map.set(`${p.x},${p.y}`, { hex: p.hex, alpha: p.alpha });
  }

  // Check all positions
  for (let y = 0; y < img1Data.height; y++) {
    for (let x = 0; x < img1Data.width; x++) {
      const key = `${x},${y}`;
      const p1 = pixels1Map.get(key) || { hex: '#000000', alpha: 0 };
      const p2 = pixels2Map.get(key) || { hex: '#000000', alpha: 0 };

      if (p1.hex !== p2.hex || p1.alpha !== p2.alpha) {
        differences.push({
          x,
          y,
          original: p1,
          generated: p2,
        });
      }
    }
  }

  return {
    match: differences.length === 0,
    differences,
  };
}

export async function writeYamlFile(sprite: ExtractedSprite, outputPath: string): Promise<void> {
  const yamlContent = spriteToYamlString(sprite);
  fs.writeFileSync(outputPath, yamlContent);
}
