import { describe, it, expect } from 'vitest';
import { computeConveyorAnimIndex } from './ConveyorRenderSystem';
import { ItemTextureMap } from '@virtcon2/network-world-entities';
import { DBItemName } from '@virtcon2/static-game-data';

const conveyorAnims = ItemTextureMap[DBItemName.BUILDING_CONVEYOR]!.animations!;
const animName = (index: number) => conveyorAnims[index]?.name ?? `<unknown index ${index}>`;

const neighborAt = (nx: number, ny: number, direction: number): Map<string, number> =>
  new Map([[`${nx},${ny}`, direction]]);

const BELT_X = 0;
const BELT_Y = 0;

describe('computeConveyorAnimIndex', () => {
  // Straight — no perpendicular feeder
  it('dir=0 (right), no neighbor → index 0 (active_right)', () => {
    const idx = computeConveyorAnimIndex(BELT_X, BELT_Y, 0, new Map());
    expect(idx).toBe(0);
    expect(animName(idx)).toBe('active_right');
  });

  it('dir=1 (down), no neighbor → index 1 (active_down)', () => {
    const idx = computeConveyorAnimIndex(BELT_X, BELT_Y, 1, new Map());
    expect(idx).toBe(1);
    expect(animName(idx)).toBe('active_down');
  });

  it('dir=2 (left), no neighbor → index 2 (active_left)', () => {
    const idx = computeConveyorAnimIndex(BELT_X, BELT_Y, 2, new Map());
    expect(idx).toBe(2);
    expect(animName(idx)).toBe('active_left');
  });

  it('dir=3 (up), no neighbor → index 3 (active_up)', () => {
    const idx = computeConveyorAnimIndex(BELT_X, BELT_Y, 3, new Map());
    expect(idx).toBe(3);
    expect(animName(idx)).toBe('active_up');
  });

  // Curves — perpendicular feeder present
  it('dir=0 (right), north feeder going down → index 4 (curve_north_east)', () => {
    const idx = computeConveyorAnimIndex(BELT_X, BELT_Y, 0, neighborAt(0, -16, 1));
    expect(idx).toBe(4);
    expect(animName(idx)).toBe('curve_north_east');
  });

  it('dir=0 (right), south feeder going up → index 8 (curve_south_east)', () => {
    const idx = computeConveyorAnimIndex(BELT_X, BELT_Y, 0, neighborAt(0, 16, 3));
    expect(idx).toBe(8);
    expect(animName(idx)).toBe('curve_south_east');
  });

  it('dir=1 (down), east feeder going left → index 5 (curve_east_south)', () => {
    const idx = computeConveyorAnimIndex(BELT_X, BELT_Y, 1, neighborAt(16, 0, 2));
    expect(idx).toBe(5);
    expect(animName(idx)).toBe('curve_east_south');
  });

  it('dir=1 (down), west feeder going right → index 10 (curve_west_south)', () => {
    const idx = computeConveyorAnimIndex(BELT_X, BELT_Y, 1, neighborAt(-16, 0, 0));
    expect(idx).toBe(10);
    expect(animName(idx)).toBe('curve_west_south');
  });

  it('dir=2 (left), south feeder going up → index 6 (curve_south_west)', () => {
    const idx = computeConveyorAnimIndex(BELT_X, BELT_Y, 2, neighborAt(0, 16, 3));
    expect(idx).toBe(6);
    expect(animName(idx)).toBe('curve_south_west');
  });

  it('dir=2 (left), north feeder going down → index 9 (curve_north_west)', () => {
    const idx = computeConveyorAnimIndex(BELT_X, BELT_Y, 2, neighborAt(0, -16, 1));
    expect(idx).toBe(9);
    expect(animName(idx)).toBe('curve_north_west');
  });

  it('dir=3 (up), west feeder going right → index 7 (curve_west_north)', () => {
    const idx = computeConveyorAnimIndex(BELT_X, BELT_Y, 3, neighborAt(-16, 0, 0));
    expect(idx).toBe(7);
    expect(animName(idx)).toBe('curve_west_north');
  });

  it('dir=3 (up), east feeder going left → index 11 (curve_east_north)', () => {
    const idx = computeConveyorAnimIndex(BELT_X, BELT_Y, 3, neighborAt(16, 0, 2));
    expect(idx).toBe(11);
    expect(animName(idx)).toBe('curve_east_north');
  });
});
