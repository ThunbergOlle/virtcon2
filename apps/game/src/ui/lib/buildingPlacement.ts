import { gql, makeVar } from '@apollo/client';
import { addComponent, addReservedEntity, Entity, removeEntity } from '@virtcon2/bytenetc';
import { ClientPacket, PacketType, RequestPlaceBuildingPacketData } from '@virtcon2/network-packet';
import { Collider, fromPhaserPos, GhostBuilding, ItemTextureMap, Position, Sprite } from '@virtcon2/network-world-entities';
import { DBUserInventoryItem, get_building_by_id } from '@virtcon2/static-game-data';
import { toast } from 'react-toastify';
import Game from '../../scenes/Game';

const buildingBeingPlacedVar = makeVar<DBUserInventoryItem | null>(null);
const buildingBeingPlacedEntitiyVar = makeVar<Entity | null>(null);

export const isTryingToPlaceBuilding = () => buildingBeingPlacedEntitiyVar() !== null;

function rotatePlaceBuildingIntent() {
  const game = Game.getInstance();
  const world = game.state.world;
  const buildingBeingPlacedEntity = buildingBeingPlacedEntitiyVar();
  if (!world || !buildingBeingPlacedEntity) return;
  Sprite(world).rotation[buildingBeingPlacedEntity] = (90 + Sprite(world).rotation[buildingBeingPlacedEntity]) % 360;
}

export const cancelPlaceBuildingIntent = () => {
  const game = Game.getInstance();

  game.input.off('pointerdown', placeBuilding);
  game.input.off('keydown-R', rotatePlaceBuildingIntent);

  buildingBeingPlacedVar(null);

  const buildingBeingPlacedEntity = buildingBeingPlacedEntitiyVar();

  if (!game.state.world || !buildingBeingPlacedEntity) return;
  removeEntity(game.state.world, buildingBeingPlacedEntity);
  buildingBeingPlacedEntitiyVar(null);
};

function placeBuilding(e: Phaser.Input.Pointer) {
  const game = Game.getInstance();
  const world = game.state.world;

  const buildingBeingPlaced = buildingBeingPlacedVar();
  const buildingBeingPlacedEntitiy = buildingBeingPlacedEntitiyVar();

  if (!buildingBeingPlaced || buildingBeingPlaced.quantity <= 0) {
    toast('You do not have any more of this building in your inventory', { type: 'error' });
    return cancelPlaceBuildingIntent();
  }
  if (!buildingBeingPlacedEntitiy || !GhostBuilding(world).placementIsValid[buildingBeingPlacedEntitiy] || !buildingBeingPlaced.item)
    return;

  toast('Placing building', { type: 'info' });

  /* Send network packet to backend that we want to place the building at the coordinates */
  /* Convert phaser coordinates to the tilemap coordinates*/
  const { x, y } = fromPhaserPos({ x: e.worldX, y: e.worldY });
  const packet: ClientPacket<RequestPlaceBuildingPacketData> = {
    data: {
      buildingItemId: buildingBeingPlaced.item.id,
      rotation: Sprite(world).rotation[buildingBeingPlacedEntitiy],
      x,
      y,
    },
    packet_type: PacketType.REQUEST_PLACE_BUILDING,
  };

  Game.network.sendPacket(packet);
}

export const START_PLACE_BUILDING_INTENT_FRAGMENT = gql`
  fragment StartPlaceBuildingIntentFragment on UserInventoryItem {
    id
    quantity
    item {
      id
      name
      is_building
      building {
        id
        is_rotatable
      }
    }
  }
`;

export function startPlaceBuildingIntent(inventoryItem: DBUserInventoryItem) {
  if (!inventoryItem.item?.is_building) return;

  const game = Game.getInstance();
  const world = game.state.world;
  if (!world) return;

  if (buildingBeingPlacedEntitiyVar() || buildingBeingPlacedVar()) cancelPlaceBuildingIntent();

  /* Create ghost building entity */
  const ghostBuilding = addReservedEntity(game.state.world, 2997);
  addComponent(game.state.world, GhostBuilding, ghostBuilding);
  addComponent(game.state.world, Sprite, ghostBuilding);
  addComponent(game.state.world, Position, ghostBuilding);
  addComponent(game.state.world, Collider, ghostBuilding);

  const buildingSettings = get_building_by_id(inventoryItem.item.building?.id ?? 0);
  if (!buildingSettings) return;

  game.state.ghostBuildingById[ghostBuilding] = buildingSettings;

  Sprite(world).texture[ghostBuilding] = ItemTextureMap[inventoryItem.item.name]?.textureId ?? 0;
  Sprite(world).height[ghostBuilding] = (buildingSettings?.height ?? 1) * 16;
  Sprite(world).width[ghostBuilding] = (buildingSettings?.width ?? 1) * 16;
  Sprite(world).opacity[ghostBuilding] = 0.5;
  Position(world).x[ghostBuilding] = 0;
  Position(world).y[ghostBuilding] = 0;

  buildingBeingPlacedEntitiyVar(ghostBuilding);
  buildingBeingPlacedVar(inventoryItem);

  // Event listeners
  game.input.on('pointerdown', placeBuilding);
  game.input.keyboard?.once('keydown-ESC', () => cancelPlaceBuildingIntent());
  game.input.keyboard?.once('keydown-Q', () => cancelPlaceBuildingIntent());
  if (buildingSettings?.is_rotatable) {
    game.input.keyboard?.on('keydown-R', () => rotatePlaceBuildingIntent());
  }
}
