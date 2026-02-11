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
  // Check positions based on entry and turn direction
  // Position 1: Opposite to turn direction
  // Position 2: Opposite to entry direction

  const checkPositions: { x: number; y: number }[] = [];

  // Position opposite to turn direction
  const oppositeTurnVec = DIRECTION_VECTORS[getOppositeDirection(turnDirection)];
  checkPositions.push({
    x: turnCenterX + oppositeTurnVec.x * tileSize,
    y: turnCenterY + oppositeTurnVec.y * tileSize,
  });

  // Position opposite to entry direction (same as entry direction vector since entry is "coming from")
  const entryVec = DIRECTION_VECTORS[entryDirection];
  checkPositions.push({
    x: turnCenterX + entryVec.x * tileSize,
    y: turnCenterY + entryVec.y * tileSize,
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
 *
 * There are two routing strategies:
 *
 * 1. **Merge Point**: When other conveyors feed into the turn, all items from one
 *    direction go to one lane to prevent collisions.
 *    - Coming from left/top (directions 2, 3) → left lane (-1)
 *    - Coming from right/bottom (directions 0, 1) → right lane (1)
 *
 * 2. **Simple Corner**: When there's no merge, lanes curve naturally (outer stays outer).
 *    The mapping follows the physical curve of the turn.
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
    // At merge points, all items from one side go to one lane
    // Coming from left (2) or up (3) → left lane (-1)
    // Coming from right (0) or down (1) → right lane (1)
    return entryDirection === 2 || entryDirection === 3 ? -1 : 1;
  }

  // Simple corner: lanes curve naturally
  // The lane mapping depends on the turn combination
  // Key insight: when turning "inward", the lane flips; when turning "outward", it stays

  // Lane conventions:
  // Horizontal: -1 = top (smaller Y), 1 = bottom (larger Y)
  // Vertical: -1 = left (smaller X), 1 = right (larger X)

  // Turn mapping table for simple corners:
  // | Entry → Turn | Lane -1 becomes | Lane 1 becomes |
  // |--------------|-----------------|----------------|
  // | Right → Down | 1 (right)       | -1 (left)      |
  // | Right → Up   | -1 (left)       | 1 (right)      |
  // | Left → Down  | -1 (left)       | 1 (right)      |
  // | Left → Up    | 1 (right)       | -1 (left)      |
  // | Down → Right | 1 (bottom)      | -1 (top)       |
  // | Down → Left  | -1 (top)        | 1 (bottom)     |
  // | Up → Right   | -1 (top)        | 1 (bottom)     |
  // | Up → Left    | 1 (bottom)      | -1 (top)       |

  // Encode this as: for certain turn combinations, flip the lane
  const shouldFlip = shouldFlipLaneAtTurn(entryDirection, turnDirection);
  return shouldFlip ? ((-currentLane) as -1 | 1) : currentLane;
};

/**
 * Helper to determine if lane should flip at a simple corner turn.
 */
const shouldFlipLaneAtTurn = (entryDirection: number, turnDirection: number): boolean => {
  // Turns that flip the lane (outer becomes inner):
  // Right (0) → Down (1): flip
  // Right (0) → Up (3): no flip
  // Left (2) → Down (1): no flip
  // Left (2) → Up (3): flip
  // Down (1) → Right (0): flip
  // Down (1) → Left (2): no flip
  // Up (3) → Right (0): no flip
  // Up (3) → Left (2): flip

  // Pattern: flip when (entry + turn) is odd and entry < 2, or even and entry >= 2
  // Simpler: flip when entry is 0 or 3, and turn is "clockwise" from entry perspective
  // Or: flip when (entry, turn) is one of: (0,1), (2,3), (1,0), (3,2)

  const flipCombinations: [number, number][] = [
    [0, 1], // Right → Down
    [2, 3], // Left → Up
    [1, 0], // Down → Right
    [3, 2], // Up → Left
  ];

  return flipCombinations.some(([e, t]) => e === entryDirection && t === turnDirection);
};
