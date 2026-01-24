import * as fs from 'fs';
import * as yaml from 'yaml';
import { SpriteDefinition } from '../types/sprite-definition';

export function parseYamlFile(filePath: string): SpriteDefinition {
  const content = fs.readFileSync(filePath, 'utf-8');
  return parseYamlString(content);
}

export function parseYamlString(content: string): SpriteDefinition {
  const parsed = yaml.parse(content) as SpriteDefinition;
  validateSpriteDefinition(parsed);
  return parsed;
}

function validateSpriteDefinition(def: SpriteDefinition): void {
  if (!def.meta) {
    throw new Error('Missing required field: meta');
  }
  if (!def.meta.name) {
    throw new Error('Missing required field: meta.name');
  }
  if (!def.meta.canvas || !Array.isArray(def.meta.canvas) || def.meta.canvas.length !== 2) {
    throw new Error('Invalid meta.canvas: must be [width, height]');
  }
  if (!def.palette || typeof def.palette !== 'object') {
    throw new Error('Missing or invalid field: palette');
  }
  if (!def.components || typeof def.components !== 'object') {
    throw new Error('Missing or invalid field: components');
  }
}
