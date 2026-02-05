import { tileSize } from './coordinates';

// ============ Constants ============
export const DIRECTION_VECTORS = [
  { x: 1, y: 0 }, // 0 = right
  { x: 0, y: 1 }, // 1 = down
  { x: -1, y: 0 }, // 2 = left
  { x: 0, y: -1 }, // 3 = up
] as const;

export const LANE_OFFSET = 4;
export const MIN_ITEM_DISTANCE = 8;
export const CHECKPOINT_THRESHOLD = 1;
export const MAX_ITEMS_PER_CONVEYOR = 2;

// ============ Item State Enum (for future extensibility) ============
export enum ConveyorItemState {
  ALIGNING = 0, // Moving perpendicular to reach lane position
  MOVING = 1, // Moving along conveyor direction
  // Future states for mergers/splitters:
  // BLOCKED = 2,
  // TRANSITIONING = 3,
}

// ============ Direction Helpers ============
export const isHorizontalDirection = (dir: number): boolean => dir === 0 || dir === 2;
export const getOppositeDirection = (dir: number): number => (dir + 2) % 4;
export const getPerpendicularDirections = (dir: number): [number, number] => [(dir + 1) % 4, (dir + 3) % 4];

// ============ Lane Helpers ============
export const getLane = (pos: number, center: number): -1 | 1 => (pos < center ? -1 : 1);
export const getLanePosition = (center: number, lane: number): number => center + lane * LANE_OFFSET;

// ============ Movement Helpers ============
export const distance = (a: { x: number; y: number }, b: { x: number; y: number }): number =>
  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

export const isAhead = (item: { x: number; y: number }, other: { x: number; y: number }, dirVec: { x: number; y: number }): boolean => {
  const dx = other.x - item.x;
  const dy = other.y - item.y;
  return dx * dirVec.x + dy * dirVec.y > 0;
};

export const moveTowardTarget = (current: number, target: number, speed: number): number => {
  const diff = target - current;
  if (Math.abs(diff) <= speed) return target;
  return current + Math.sign(diff) * speed;
};

// ============ Tile Helpers ============
export const posToTileKey = (x: number, y: number): string => `${Math.floor(x / tileSize)},${Math.floor(y / tileSize)}`;
