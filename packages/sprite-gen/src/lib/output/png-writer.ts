import * as fs from 'fs';
import { Canvas } from 'canvas';

export function writePng(canvas: Canvas, outputPath: string): void {
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
}

export function getPngBuffer(canvas: Canvas): Buffer {
  return canvas.toBuffer('image/png');
}
