import { defineQuery, defineSystem, World } from '@virtcon2/bytenetc';
import { Animation, Conveyor, Position, Sprite, getTextureFromTextureId } from '@virtcon2/network-world-entities';
import { GameState } from '../scenes/Game';

const TILE_SIZE = 16;

// Curve animation indices: [outputDir][feederSide]
// feederSide: 0=north, 1=south, 2=east, 3=west
const CURVE_ANIM_INDEX: Record<number, Record<number, number>> = {
  0: { 0: 8, 1: 4 }, // right: north→curve_north_east(4), south→curve_south_east(8)
  1: { 2: 5, 3: 10 }, // down:  east→curve_east_south(5), west→curve_west_south(10)
  2: { 1: 6, 0: 9 }, // left:  south→curve_south_west(6), north→curve_north_west(9)
  3: { 3: 7, 2: 11 }, // up:    west→curve_west_north(7), east→curve_east_north(11)
};

// Perpendicular neighbor offsets and their feeder sides, keyed by output direction
// Each entry: [dx, dy, feederSide, feederDir]
// feederDir: direction the neighbor must have to feed into this belt
const PERP_NEIGHBORS: Record<number, [number, number, number, number][]> = {
  0: [
    [0, -TILE_SIZE, 0, 1],
    [0, TILE_SIZE, 1, 3],
  ], // right: check north(dir=1) and south(dir=3)
  1: [
    [TILE_SIZE, 0, 2, 2],
    [-TILE_SIZE, 0, 3, 0],
  ], // down:  check east(dir=2) and west(dir=0)
  2: [
    [0, -TILE_SIZE, 0, 1],
    [0, TILE_SIZE, 1, 3],
  ], // left:  check north(dir=1) and south(dir=3)
  3: [
    [TILE_SIZE, 0, 2, 2],
    [-TILE_SIZE, 0, 3, 0],
  ], // up:    check east(dir=2) and west(dir=0)
};

// Exported for testing: pure version that takes explicit coords and a direction map
export const computeConveyorAnimIndex = (
  x: number,
  y: number,
  dir: number,
  neighborDirs: Map<string, number>, // `${x},${y}` → direction of conveyor at that pos
): number => {
  const neighbors = PERP_NEIGHBORS[dir];
  if (!neighbors) return dir;

  for (const [dx, dy, feederSide, feederDir] of neighbors) {
    const neighborDir = neighborDirs.get(`${x + dx},${y + dy}`);
    if (neighborDir === undefined) continue;
    if (neighborDir === feederDir) {
      return CURVE_ANIM_INDEX[dir]?.[feederSide] ?? dir;
    }
  }

  return dir; // straight animation
};

const getConveyorAnimIndex = (world: World, eid: number, dir: number, posMap: Map<string, number>): number => {
  const x = Position(world).x[eid];
  const y = Position(world).y[eid];

  const neighborDirs = new Map<string, number>();
  for (const [key, neighborEid] of posMap) {
    neighborDirs.set(key, Conveyor(world).direction[neighborEid]);
  }

  return computeConveyorAnimIndex(x, y, dir, neighborDirs);
};

export const createConveyorRenderSystem = (world: World) => {
  const conveyorQuery = defineQuery(Conveyor, Position, Sprite);

  return defineSystem<GameState>((state) => {
    const entities = conveyorQuery(world);

    // Build tile-position → entity map
    const posMap = new Map<string, number>();
    for (const eid of entities) {
      posMap.set(`${Position(world).x[eid]},${Position(world).y[eid]}`, eid);
    }

    for (const eid of entities) {
      const sprite = state.spritesById[eid];
      if (!sprite) continue;

      const dir = Conveyor(world).direction[eid];
      const animIndex = getConveyorAnimIndex(world, eid, dir, posMap);

      // Skip if animIndex is already correct (avoid restarting the animation)
      if (Animation(world).animationIndex[eid] === animIndex) continue;
      Animation(world).animationIndex[eid] = animIndex;

      //const texture = getTextureFromTextureId(Sprite(world).texture[eid]);
      //if (!texture?.animations) continue;
      //
      //const animData = texture.animations[animIndex];
      //if (!animData) continue;
      //
      //const variant = Sprite(world).variant[eid] || 0;
      //const animKey = `${texture.textureName}_${variant}_anim_${animData.name}`;
      //
      //if (sprite.anims.currentAnim?.key !== animKey) {
      //  sprite.anims.play(animKey);
      //}
    }

    return state;
  });
};
