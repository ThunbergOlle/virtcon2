import { addComponent, defineQuery, defineSerializer, defineSystem, Not, World } from '@virtcon2/bytenetc';
import {
  Building,
  Collider,
  Conveyor,
  ConveyorItem,
  getSerializeConfig,
  Item,
  Position,
  SerializationID,
  tileSize,
} from '@virtcon2/network-world-entities';
import { SyncEntities } from './types';

// Direction vectors: 0=right, 1=down, 2=left, 3=up
const DIRECTION_VECTORS = [
  { x: 1, y: 0 }, // right
  { x: 0, y: 1 }, // down
  { x: -1, y: 0 }, // left
  { x: 0, y: -1 }, // up
];

// Minimum distance between items on conveyor (item size)
const MIN_ITEM_DISTANCE = 8;

export const createConveyorSystem = (world: World) => {
  const conveyorQuery = defineQuery(Conveyor, Building, Position);
  const itemNotOnConveyorQuery = defineQuery(Item, Position, Not(ConveyorItem));
  const conveyorItemQuery = defineQuery(Item, ConveyorItem, Position);

  return defineSystem<SyncEntities>(({ worldData, sync, removeEntities }) => {
    const conveyorEntities = conveyorQuery(world);
    const itemsNotOnConveyor = itemNotOnConveyorQuery(world);
    const conveyorItemEntities = conveyorItemQuery(world);
    const changedEntities: number[] = [];

    // Build a lookup map of conveyor positions for fast collision detection
    // Key: "tileX,tileY" -> conveyor entity
    const conveyorMap = new Map<string, number>();
    for (let i = 0; i < conveyorEntities.length; i++) {
      const eid = conveyorEntities[i];
      const x = Position(world).x[eid];
      const y = Position(world).y[eid];
      const tileX = Math.floor(x / tileSize);
      const tileY = Math.floor(y / tileSize);
      conveyorMap.set(`${tileX},${tileY}`, eid);
    }

    // Helper: find conveyor at a pixel position
    const findConveyorAt = (px: number, py: number): number | null => {
      const tileX = Math.floor(px / tileSize);
      const tileY = Math.floor(py / tileSize);
      return conveyorMap.get(`${tileX},${tileY}`) ?? null;
    };

    // Step 1: Detect items entering conveyors (items without ConveyorItem component)
    for (let i = 0; i < itemsNotOnConveyor.length; i++) {
      const itemEid = itemsNotOnConveyor[i];

      const itemX = Position(world).x[itemEid];
      const itemY = Position(world).y[itemEid];
      const conveyorEid = findConveyorAt(itemX, itemY);

      if (conveyorEid !== null) {
        // Item is on a conveyor - add ConveyorItem component
        addComponent(world, ConveyorItem, itemEid);
        ConveyorItem(world).onConveyorEntity[itemEid] = conveyorEid;

        // Make item dynamic (moveable)
        Collider(world).static[itemEid] = 0;

        changedEntities.push(itemEid);
      }
    }

    // Step 2: Move items on conveyors and handle collisions
    // Sort items by position along conveyor direction to handle stacking properly
    const itemsOnConveyors: { eid: number; x: number; y: number; conveyorEid: number }[] = [];

    for (let i = 0; i < conveyorItemEntities.length; i++) {
      const itemEid = conveyorItemEntities[i];
      const conveyorEid = ConveyorItem(world).onConveyorEntity[itemEid];

      // Verify the conveyor still exists
      if (
        !conveyorMap.has(
          `${Math.floor(Position(world).x[conveyorEid] / tileSize)},${Math.floor(Position(world).y[conveyorEid] / tileSize)}`,
        )
      ) {
        continue;
      }

      itemsOnConveyors.push({
        eid: itemEid,
        x: Position(world).x[itemEid],
        y: Position(world).y[itemEid],
        conveyorEid,
      });
    }

    // Process each item
    for (const item of itemsOnConveyors) {
      const { eid: itemEid, conveyorEid } = item;
      const direction = Conveyor(world).direction[conveyorEid];
      const speed = Conveyor(world).speed[conveyorEid];
      const dirVec = DIRECTION_VECTORS[direction];

      const currentX = Position(world).x[itemEid];
      const currentY = Position(world).y[itemEid];

      // Calculate new position
      const newX = currentX + dirVec.x * speed;
      const newY = currentY + dirVec.y * speed;

      // Check if new position is still on a conveyor
      const nextConveyorEid = findConveyorAt(newX, newY);

      if (nextConveyorEid !== null) {
        // Check collision with items ahead
        let blocked = false;
        for (const otherItem of itemsOnConveyors) {
          if (otherItem.eid === itemEid) continue;

          const otherX = Position(world).x[otherItem.eid];
          const otherY = Position(world).y[otherItem.eid];

          // Calculate distance between items
          const dx = newX - otherX;
          const dy = newY - otherY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < MIN_ITEM_DISTANCE) {
            // Check if this item is ahead in the conveyor direction
            const dotProduct = dx * dirVec.x + dy * dirVec.y;
            if (dotProduct > 0) {
              // Other item is ahead - we're blocked
              blocked = true;
              break;
            }
          }
        }

        if (!blocked) {
          // Move item
          Position(world).x[itemEid] = newX;
          Position(world).y[itemEid] = newY;
          ConveyorItem(world).onConveyorEntity[itemEid] = nextConveyorEid;

          if (!changedEntities.includes(itemEid)) {
            changedEntities.push(itemEid);
          }
        }
      } else {
        // Item would leave conveyor - clamp to boundary
        const conveyorX = Position(world).x[conveyorEid];
        const conveyorY = Position(world).y[conveyorEid];

        // Clamp position to stay within conveyor tile
        const halfTile = tileSize / 2;
        const halfItem = MIN_ITEM_DISTANCE / 2;

        const minX = conveyorX - halfTile + halfItem;
        const maxX = conveyorX + halfTile - halfItem;
        const minY = conveyorY - halfTile + halfItem;
        const maxY = conveyorY + halfTile - halfItem;

        const clampedX = Math.max(minX, Math.min(maxX, newX));
        const clampedY = Math.max(minY, Math.min(maxY, newY));

        if (clampedX !== currentX || clampedY !== currentY) {
          Position(world).x[itemEid] = clampedX;
          Position(world).y[itemEid] = clampedY;

          if (!changedEntities.includes(itemEid)) {
            changedEntities.push(itemEid);
          }
        }
      }
    }

    // Sync changed items
    if (changedEntities.length > 0) {
      const serialize = defineSerializer(getSerializeConfig(world)[SerializationID.CONVEYOR_ITEM]);
      const serializedData = serialize(world, changedEntities);

      sync.push({
        data: serializedData,
        serializationId: SerializationID.CONVEYOR_ITEM,
      });
    }

    return { worldData, sync, removeEntities };
  });
};
