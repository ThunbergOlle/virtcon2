#!/usr/bin/env ts-node
import * as fs from 'fs';
import * as path from 'path';

type FieldValue = number | number[] | Record<string, unknown>;
type Field = [string, string, FieldValue];
type Entity = Field[];
type Dump = Entity[];

// ANSI colors
const R = '\x1b[31m';
const G = '\x1b[32m';
const Y = '\x1b[33m';
const C = '\x1b[36m';
const B = '\x1b[1m';
const RESET = '\x1b[0m';

function getEntityId(entity: Entity): number {
  const idField = entity.find(([comp, field]) => comp === '_entity' && field === '_entity');
  if (!idField) throw new Error('Entity missing _entity field');
  return idField[2] as number;
}

function indexEntities(dump: Dump): Map<number, Entity> {
  const map = new Map<number, Entity>();
  for (const entity of dump) {
    const id = getEntityId(entity);
    map.set(id, entity);
  }
  return map;
}

function entityToFieldMap(entity: Entity, ignoredComponents?: Set<string>): Map<string, FieldValue> {
  const map = new Map<string, FieldValue>();
  for (const [comp, field, value] of entity) {
    if (comp === '_entity') continue;
    if (ignoredComponents && ignoredComponents.has(comp)) continue;
    map.set(`${comp}.${field}`, value);
  }
  return map;
}

// Byte-keyed objects (e.g. {"0":103,"1":114,...}) are serialized strings — decode them
function decodeByteObject(v: Record<string, number>): string | null {
  const keys = Object.keys(v);
  if (keys.length === 0) return null;
  // Keys must be consecutive integers starting at 0
  const sorted = keys.map(Number).sort((a, b) => a - b);
  if (sorted[0] !== 0 || sorted[sorted.length - 1] !== sorted.length - 1) return null;
  const chars = sorted.map((k) => v[String(k)]);
  if (chars.some((c) => c < 0 || c > 127)) return null;
  return chars.map((c) => String.fromCharCode(c)).join('');
}

function normalizeVal(v: FieldValue): string {
  if (Array.isArray(v)) return JSON.stringify(v);
  if (typeof v === 'object' && v !== null) {
    // Node.js Buffer serialized as { type: 'Buffer', data: [...] }
    const obj = v as Record<string, unknown>;
    if (obj['type'] === 'Buffer' && Array.isArray(obj['data'])) {
      const bytes = obj['data'] as number[];
      if (bytes.every((c) => c >= 0 && c <= 127)) {
        return bytes.map((c) => String.fromCharCode(c)).join('');
      }
      return JSON.stringify(bytes);
    }
    const decoded = decodeByteObject(v as Record<string, number>);
    return decoded !== null ? decoded : JSON.stringify(v);
  }
  return String(v);
}

function valEqual(a: FieldValue, b: FieldValue): boolean {
  return normalizeVal(a) === normalizeVal(b);
}

function formatVal(v: FieldValue): string {
  return normalizeVal(v);
}

function entitySummary(entity: Entity): string {
  const fields = entityToFieldMap(entity);
  const parts: string[] = [];
  const x = fields.get('position.x');
  const y = fields.get('position.y');
  if (x !== undefined && y !== undefined) parts.push(`pos: ${formatVal(x)},${formatVal(y)}`);
  const tex = fields.get('sprite.texture');
  if (tex !== undefined) parts.push(`sprite.texture: ${formatVal(tex)}`);
  return parts.length ? `[${parts.join('] [')}]` : '';
}

function main() {
  const args = process.argv.slice(2);
  const ignoredComponents = new Set<string>();

  // Parse --ignore-component flags
  const positional: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--ignore-component' || args[i] === '-I') {
      const comp = args[++i];
      if (!comp) { console.error('--ignore-component requires a value'); process.exit(2); }
      ignoredComponents.add(comp);
    } else {
      positional.push(args[i]);
    }
  }

  const [fileA, fileB] = positional;
  if (!fileA || !fileB) {
    console.error('Usage: npx ts-node -P tools/tsconfig.tools.json tools/ecs-diff.ts <dump-a.json> <dump-b.json> [--ignore-component <name>] ...');
    process.exit(2);
  }

  const dumpA: Dump = JSON.parse(fs.readFileSync(path.resolve(fileA), 'utf8'));
  const dumpB: Dump = JSON.parse(fs.readFileSync(path.resolve(fileB), 'utf8'));

  const mapA = indexEntities(dumpA);
  const mapB = indexEntities(dumpB);

  const removed: Entity[] = [];
  const changed: Array<{ id: number; diffs: Array<{ key: string; a: FieldValue | undefined; b: FieldValue | undefined }> }> = [];
  const added: Entity[] = [];

  Array.from(mapA.entries()).forEach(([id, entityA]) => {
    const entityB = mapB.get(id);
    if (!entityB) {
      removed.push(entityA);
      return;
    }
    const fieldsA = entityToFieldMap(entityA, ignoredComponents);
    const fieldsB = entityToFieldMap(entityB, ignoredComponents);
    const allKeys = Array.from(new Set(Array.from(fieldsA.keys()).concat(Array.from(fieldsB.keys()))));
    const diffs: Array<{ key: string; a: FieldValue | undefined; b: FieldValue | undefined }> = [];
    allKeys.forEach((key) => {
      const va = fieldsA.get(key);
      const vb = fieldsB.get(key);
      if (va === undefined || vb === undefined || !valEqual(va, vb)) {
        diffs.push({ key, a: va, b: vb });
      }
    });
    if (diffs.length > 0) changed.push({ id, diffs });
  });

  Array.from(mapB.entries()).forEach(([id, entityB]) => {
    if (!mapA.has(id)) added.push(entityB);
  });

  removed.sort((a, b) => getEntityId(a) - getEntityId(b));
  added.sort((a, b) => getEntityId(a) - getEntityId(b));
  changed.sort((a, b) => a.id - b.id);

  console.log(`\n${B}=== ECS Dump Diff ===${RESET}`);
  console.log(`A: ${fileA}  (${dumpA.length} entities)`);
  console.log(`B: ${fileB}  (${dumpB.length} entities)`);
  if (ignoredComponents.size > 0) {
    console.log(`Ignoring components: ${Array.from(ignoredComponents).join(', ')}`);
  }
  console.log(`\nSummary: ${G}+${added.length} added${RESET}, ${R}-${removed.length} removed${RESET}, ${Y}~${changed.length} changed${RESET}`);

  if (removed.length > 0) {
    console.log(`\n${R}${B}--- REMOVED (${removed.length}) ---${RESET}`);
    for (const entity of removed) {
      const id = getEntityId(entity);
      console.log(`  ${R}Entity #${id}${RESET}  ${entitySummary(entity)}`);
    }
  }

  if (added.length > 0) {
    console.log(`\n${G}${B}--- ADDED (${added.length}) ---${RESET}`);
    for (const entity of added) {
      const id = getEntityId(entity);
      console.log(`  ${G}Entity #${id}${RESET}  ${entitySummary(entity)}`);
    }
  }

  if (changed.length > 0) {
    console.log(`\n${Y}${B}--- CHANGED (${changed.length}) ---${RESET}`);
    for (const { id, diffs } of changed) {
      console.log(`  ${C}Entity #${id}${RESET}`);
      for (const { key, a, b } of diffs) {
        const aStr = a === undefined ? `${R}(missing)${RESET}` : `${R}${formatVal(a)}${RESET}`;
        const bStr = b === undefined ? `${G}(missing)${RESET}` : `${G}${formatVal(b)}${RESET}`;
        const padded = key.padEnd(30);
        console.log(`    ${padded} ${aStr} → ${bStr}`);
      }
    }
  }

  console.log('');
  process.exit(removed.length + added.length + changed.length > 0 ? 1 : 0);
}

main();
