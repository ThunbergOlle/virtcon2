import { defineQuery, defineSystem, World } from '@virtcon2/bytenetc';
import { Harvestable, Position, Resource } from '@virtcon2/network-world-entities';
import { GameState } from '../scenes/Game';
import { fromPhaserPos, toPhaserPos } from '../ui/lib/coordinates';
import { store } from '../store';
import { setHoveredResource } from '../ui/components/resourceTooltip/ResourceTooltipSlice';

export const createCursorHighlightSystem = (scene: Phaser.Scene, world: World) => {
  let cursorSprite: Phaser.GameObjects.Sprite | null = null;
  const resourceQuery = defineQuery(Resource, Position);
  const harvestableQuery = defineQuery(Harvestable, Position);

  return defineSystem<GameState>((state) => {
    // Create sprite on first run
    if (!cursorSprite) {
      cursorSprite = scene.add.sprite(0, 0, 'cursor_highlighter_0');
      cursorSprite.setAlpha(0.7);
      cursorSprite.setDepth(1000);
      cursorSprite.setDisplaySize(16, 16);
    }

    // Get mouse position in world coordinates
    const mouseWorldX = scene.input.activePointer.worldX;
    const mouseWorldY = scene.input.activePointer.worldY;

    // Convert to tile coordinates and snap to grid
    const tileCoords = fromPhaserPos({ x: mouseWorldX, y: mouseWorldY });
    const snappedPos = toPhaserPos(tileCoords);

    // Update sprite position
    cursorSprite.setPosition(snappedPos.x, snappedPos.y);

    // Check for resources at cursor position
    const resources = resourceQuery(world);
    let foundEntity = false;

    for (let i = 0; i < resources.length; i++) {
      const eid = resources[i];
      const entityTileCoords = fromPhaserPos({
        x: Position(world).x[eid],
        y: Position(world).y[eid],
      });

      // Check if this resource is at the cursor tile position
      if (entityTileCoords.x === tileCoords.x && entityTileCoords.y === tileCoords.y) {
        store.dispatch(
          setHoveredResource({
            eid: eid,
            itemId: Resource(world).itemId[eid],
            quantity: Resource(world).quantity[eid],
            health: Resource(world).health[eid],
            type: 'resource',
          })
        );
        foundEntity = true;
        break;
      }
    }

    // Check for harvestables at cursor position if no resource found
    if (!foundEntity) {
      const harvestables = harvestableQuery(world);

      for (let i = 0; i < harvestables.length; i++) {
        const eid = harvestables[i];
        const entityTileCoords = fromPhaserPos({
          x: Position(world).x[eid],
          y: Position(world).y[eid],
        });

        // Check if this harvestable is at the cursor tile position
        if (entityTileCoords.x === tileCoords.x && entityTileCoords.y === tileCoords.y) {
          store.dispatch(
            setHoveredResource({
              eid: eid,
              itemId: Harvestable(world).itemId[eid],
              quantity: 0, // Harvestables don't have quantity
              health: Harvestable(world).health[eid],
              type: 'harvestable',
              dropCount: Harvestable(world).dropCount[eid],
            })
          );
          foundEntity = true;
          break;
        }
      }
    }

    // Clear hovered resource if cursor not over any resource or harvestable
    if (!foundEntity) {
      store.dispatch(setHoveredResource(null));
    }

    return state;
  });
};
