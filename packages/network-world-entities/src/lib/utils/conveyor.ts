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

// ============ Lane Routing at Turns ============

/**
 * Checks if a turn is a merge point by looking for conveyors at perpendicular positions.
 *
 * At a merge point, items from different directions would collide if they went to the
 * same lane, so we use a different routing strategy.
 *
 * @param conveyorMap - Map from tile key to conveyor entity ID
 * @param turnCenterX - X position of the turn conveyor's center
 * @param turnCenterY - Y position of the turn conveyor's center
 * @param entryDirection - Direction the item is coming FROM (0=right, 1=down, 2=left, 3=up)
 * @param turnDirection - Direction of the next conveyor
 * @returns true if there are conveyors at perpendicular positions that make this a merge point
 */
export const isTurnMergePoint = (
  conveyorMap: Map<string, number>,
  turnCenterX: number,
  turnCenterY: number,
  entryDirection: number,
  turnDirection: number
): boolean => {
  // A merge point exists when there's a THIRD conveyor feeding into the turn
  // (besides the incoming conveyor and the outgoing direction)
  //
  // We check two positions:
  // 1. Opposite to turn direction (behind the turn) - could have a feeder
  // 2. Opposite to entry direction (the other side) - could have another feeder
  //
  // We do NOT check:
  // - The entry direction position (that's where we came from - always has a conveyor)
  // - The turn direction position (that's where we're going)

  const checkPositions: { x: number; y: number }[] = [];

  // Position opposite to turn direction (behind the turn)
  const oppositeTurnVec = DIRECTION_VECTORS[getOppositeDirection(turnDirection)];
  checkPositions.push({
    x: turnCenterX + oppositeTurnVec.x * tileSize,
    y: turnCenterY + oppositeTurnVec.y * tileSize,
  });

  // Position opposite to entry direction (the other perpendicular side)
  // Entry direction is where we came FROM, so opposite is the other side
  const oppositeEntryVec = DIRECTION_VECTORS[getOppositeDirection(entryDirection)];
  checkPositions.push({
    x: turnCenterX + oppositeEntryVec.x * tileSize,
    y: turnCenterY + oppositeEntryVec.y * tileSize,
  });

  // Check if any of these positions have a conveyor
  for (const pos of checkPositions) {
    const key = posToTileKey(pos.x, pos.y);
    if (conveyorMap.has(key)) {
      return true;
    }
  }

  return false;
};

/**
 * Determines the target lane when transitioning between perpendicular conveyors.
 * Implements Factorio-style belt lane routing.
 *
 * There are two routing strategies:
 *
 * 1. **Merge Point (T-junction)**: When 3+ conveyors connect, items go to the
 *    "near lane" - the lane closest to where they entered. This matches Factorio's
 *    sideloading behavior.
 *    - Coming from left/up (directions 2, 3) → left lane (-1)
 *    - Coming from right/down (directions 0, 1) → right lane (1)
 *
 * 2. **Simple Corner**: Items preserve their physical track position - inner lane
 *    stays inner, outer lane stays outer. This requires flipping the lane number
 *    for certain turn combinations.
 *
 * @param currentLane - Item's current lane (-1 or 1)
 * @param entryDirection - Direction the item is coming FROM (0=right, 1=down, 2=left, 3=up)
 * @param turnDirection - Direction of the next conveyor
 * @param isMergePoint - Whether there are other conveyors feeding into this turn
 * @returns Target lane on the next conveyor (-1 or 1)
 */
export const getTargetLaneAtTurn = (
  currentLane: -1 | 1,
  entryDirection: number,
  turnDirection: number,
  isMergePoint: boolean
): -1 | 1 => {
  if (isMergePoint) {
    // At merge points, items go to the "near lane" (Factorio sideloading behavior)
    // Coming from left (2) or up (3) → left lane (-1)
    // Coming from right (0) or down (1) → right lane (1)
    return entryDirection === 2 || entryDirection === 3 ? -1 : 1;
  }

  // Simple corner: preserve physical track position (inner stays inner, outer stays outer)
  // This requires flipping the lane number for certain turn combinations
  const shouldFlip = shouldFlipLaneAtTurn(entryDirection, turnDirection);
  return shouldFlip ? ((-currentLane) as -1 | 1) : currentLane;
};

/**
 * Determines if lane number should flip at a simple corner to preserve physical track position.
 *
 * Lane conventions:
 * - Horizontal: -1 = top (smaller Y), 1 = bottom (larger Y)
 * - Vertical: -1 = left (smaller X), 1 = right (larger X)
 *
 * To keep items on the same physical track (inner/outer), we flip the lane number
 * when the "inside" of the turn changes sides.
 */
const shouldFlipLaneAtTurn = (entryDirection: number, turnDirection: number): boolean => {
  // Flip combinations: when turning causes the physical inside/outside to swap lane numbers
  const flipCombinations: [number, number][] = [
    [2, 1], // Moving right → down (entry from left, turn down)
    [0, 3], // Moving left → up (entry from right, turn up)
    [3, 0], // Moving down → right (entry from above, turn right)
    [1, 2], // Moving up → left (entry from below, turn left)
  ];

  return flipCombinations.some(([e, t]) => e === entryDirection && t === turnDirection);
};
