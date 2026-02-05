import {
  DIRECTION_VECTORS,
  LANE_OFFSET,
  MIN_ITEM_DISTANCE,
  CHECKPOINT_THRESHOLD,
  ConveyorItemState,
  isHorizontalDirection,
  getOppositeDirection,
  getPerpendicularDirections,
  getLane,
  getLanePosition,
  distance,
  isAhead,
  moveTowardTarget,
  posToTileKey,
} from './conveyor';

describe('conveyor utilities', () => {
  describe('DIRECTION_VECTORS', () => {
    it('has correct vectors for all 4 directions', () => {
      expect(DIRECTION_VECTORS[0]).toEqual({ x: 1, y: 0 }); // right
      expect(DIRECTION_VECTORS[1]).toEqual({ x: 0, y: 1 }); // down
      expect(DIRECTION_VECTORS[2]).toEqual({ x: -1, y: 0 }); // left
      expect(DIRECTION_VECTORS[3]).toEqual({ x: 0, y: -1 }); // up
    });
  });

  describe('constants', () => {
    it('has expected values', () => {
      expect(LANE_OFFSET).toBe(4);
      expect(MIN_ITEM_DISTANCE).toBe(8);
      expect(CHECKPOINT_THRESHOLD).toBe(1);
    });
  });

  describe('ConveyorItemState', () => {
    it('has correct values', () => {
      expect(ConveyorItemState.ALIGNING).toBe(0);
      expect(ConveyorItemState.MOVING).toBe(1);
    });
  });

  describe('isHorizontalDirection', () => {
    it('returns true for right (0)', () => {
      expect(isHorizontalDirection(0)).toBe(true);
    });

    it('returns true for left (2)', () => {
      expect(isHorizontalDirection(2)).toBe(true);
    });

    it('returns false for down (1)', () => {
      expect(isHorizontalDirection(1)).toBe(false);
    });

    it('returns false for up (3)', () => {
      expect(isHorizontalDirection(3)).toBe(false);
    });
  });

  describe('getOppositeDirection', () => {
    it('returns left for right', () => {
      expect(getOppositeDirection(0)).toBe(2);
    });

    it('returns up for down', () => {
      expect(getOppositeDirection(1)).toBe(3);
    });

    it('returns right for left', () => {
      expect(getOppositeDirection(2)).toBe(0);
    });

    it('returns down for up', () => {
      expect(getOppositeDirection(3)).toBe(1);
    });
  });

  describe('getPerpendicularDirections', () => {
    it('returns up/down for horizontal directions', () => {
      expect(getPerpendicularDirections(0)).toEqual([1, 3]); // right -> down, up
      expect(getPerpendicularDirections(2)).toEqual([3, 1]); // left -> up, down
    });

    it('returns left/right for vertical directions', () => {
      expect(getPerpendicularDirections(1)).toEqual([2, 0]); // down -> left, right
      expect(getPerpendicularDirections(3)).toEqual([0, 2]); // up -> right, left
    });
  });

  describe('getLane', () => {
    it('returns -1 for positions before center', () => {
      expect(getLane(10, 15)).toBe(-1);
      expect(getLane(0, 100)).toBe(-1);
    });

    it('returns 1 for positions at center', () => {
      expect(getLane(15, 15)).toBe(1);
    });

    it('returns 1 for positions after center', () => {
      expect(getLane(20, 15)).toBe(1);
      expect(getLane(100, 50)).toBe(1);
    });
  });

  describe('getLanePosition', () => {
    it('returns center minus offset for lane -1', () => {
      expect(getLanePosition(100, -1)).toBe(100 - LANE_OFFSET);
    });

    it('returns center plus offset for lane 1', () => {
      expect(getLanePosition(100, 1)).toBe(100 + LANE_OFFSET);
    });
  });

  describe('distance', () => {
    it('calculates distance between two points', () => {
      expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
      expect(distance({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
    });

    it('handles negative coordinates', () => {
      expect(distance({ x: -3, y: -4 }, { x: 0, y: 0 })).toBe(5);
    });
  });

  describe('isAhead', () => {
    const rightDir = DIRECTION_VECTORS[0];
    const downDir = DIRECTION_VECTORS[1];
    const leftDir = DIRECTION_VECTORS[2];
    const upDir = DIRECTION_VECTORS[3];

    it('detects item ahead when moving right', () => {
      const item = { x: 0, y: 0 };
      const ahead = { x: 10, y: 0 };
      const behind = { x: -10, y: 0 };

      expect(isAhead(item, ahead, rightDir)).toBe(true);
      expect(isAhead(item, behind, rightDir)).toBe(false);
    });

    it('detects item ahead when moving down', () => {
      const item = { x: 0, y: 0 };
      const ahead = { x: 0, y: 10 };
      const behind = { x: 0, y: -10 };

      expect(isAhead(item, ahead, downDir)).toBe(true);
      expect(isAhead(item, behind, downDir)).toBe(false);
    });

    it('detects item ahead when moving left', () => {
      const item = { x: 0, y: 0 };
      const ahead = { x: -10, y: 0 };
      const behind = { x: 10, y: 0 };

      expect(isAhead(item, ahead, leftDir)).toBe(true);
      expect(isAhead(item, behind, leftDir)).toBe(false);
    });

    it('detects item ahead when moving up', () => {
      const item = { x: 0, y: 0 };
      const ahead = { x: 0, y: -10 };
      const behind = { x: 0, y: 10 };

      expect(isAhead(item, ahead, upDir)).toBe(true);
      expect(isAhead(item, behind, upDir)).toBe(false);
    });

    it('returns false for item at same position', () => {
      const item = { x: 5, y: 5 };
      const same = { x: 5, y: 5 };

      expect(isAhead(item, same, rightDir)).toBe(false);
    });
  });

  describe('moveTowardTarget', () => {
    it('moves toward target by speed amount', () => {
      expect(moveTowardTarget(0, 10, 2)).toBe(2);
      expect(moveTowardTarget(0, -10, 2)).toBe(-2);
    });

    it('snaps to target when within speed distance', () => {
      expect(moveTowardTarget(8, 10, 3)).toBe(10);
      expect(moveTowardTarget(-8, -10, 3)).toBe(-10);
    });

    it('returns target when already at target', () => {
      expect(moveTowardTarget(10, 10, 2)).toBe(10);
    });
  });

  describe('posToTileKey', () => {
    // tileSize is 16
    it('converts pixel position to tile key string', () => {
      expect(posToTileKey(0, 0)).toBe('0,0');
      expect(posToTileKey(8, 8)).toBe('0,0');
      expect(posToTileKey(16, 16)).toBe('1,1');
      expect(posToTileKey(24, 40)).toBe('1,2');
    });

    it('handles negative coordinates', () => {
      expect(posToTileKey(-8, -8)).toBe('-1,-1');
      expect(posToTileKey(-16, -16)).toBe('-1,-1');
      expect(posToTileKey(-17, -17)).toBe('-2,-2');
    });
  });
});
