import { gql, makeVar } from '@apollo/client';
import { addComponent, addReservedEntity, Entity, removeEntity } from '@virtcon2/bytenetc';
import { ClientPacket, PacketType, RequestPlaceHarvestablePacketData } from '@virtcon2/network-packet';
import { AllTextureMaps, Collider, fromPhaserPos, GameObjectGroups, getSpriteForAge, GhostHarvestable, HarvestableTextureMap, Position, Sprite } from '@virtcon2/network-world-entities';
import { DBUserInventoryItem, Harvestable, Harvestable as HarvestableData } from '@virtcon2/static-game-data';
import { clone } from 'ramda';
import { toast } from 'react-toastify';
import Game from '../../scenes/Game';

const harvestableBeingPlacedVar = makeVar<DBUserInventoryItem | null>(null);
const harvestableBeingPlacedEntityVar = makeVar<Entity | null>(null);

export const isTryingToPlaceHarvestable = () => harvestableBeingPlacedEntityVar() !== null;

export const cancelPlaceHarvestableIntent = () => {
  const game = Game.getInstance();

  game.input.off('pointerdown', placeHarvestable);

  harvestableBeingPlacedVar(null);

  const harvestableBeingPlacedEntity = harvestableBeingPlacedEntityVar();

  if (!game.state.world || !harvestableBeingPlacedEntity) return;
  removeEntity(game.state.world, harvestableBeingPlacedEntity);
  harvestableBeingPlacedEntityVar(null);
};

function placeHarvestable(e: Phaser.Input.Pointer) {
  const game = Game.getInstance();
  const world = game.state.world;

  const harvestableBeingPlaced = harvestableBeingPlacedVar();
  const harvestableBeingPlacedEntity = harvestableBeingPlacedEntityVar();

  if (!harvestableBeingPlaced || harvestableBeingPlaced.quantity <= 0) {
    toast('You do not have any more of this item in your inventory', { type: 'error' });
    return cancelPlaceHarvestableIntent();
  }
  if (!harvestableBeingPlacedEntity || !GhostHarvestable(world).placementIsValid[harvestableBeingPlacedEntity] || !harvestableBeingPlaced.item)
    return;

  toast('Placing harvestable', { type: 'info' });

  /* Send network packet to backend that we want to place the harvestable at the coordinates */
  /* Convert phaser coordinates to the tilemap coordinates*/
  const { x, y } = fromPhaserPos({ x: e.worldX, y: e.worldY });
  const packet: ClientPacket<RequestPlaceHarvestablePacketData> = {
    data: {
      itemId: harvestableBeingPlaced.item.id,
      x,
      y,
    },
    packet_type: PacketType.REQUEST_PLACE_HARVESTABLE,
  };

  Game.network.sendPacket(packet);
}

export const START_PLACE_HARVESTABLE_INTENT_FRAGMENT = gql`
  fragment StartPlaceHarvestableIntentFragment on UserInventoryItem {
    id
    item {
      id
      name
      harvestable {
        name
      }
    }
  }
`;

export function startPlaceHarvestableIntent(inventoryItem: DBUserInventoryItem) {
  if (!inventoryItem.item?.harvestable) return;

  const game = Game.getInstance();
  const world = game.state.world;
  if (!world) return;

  if (harvestableBeingPlacedEntityVar() || harvestableBeingPlacedVar()) cancelPlaceHarvestableIntent();

  /* Create ghost harvestable entity */
  const ghostHarvestable = addReservedEntity(game.state.world, 2998);
  addComponent(game.state.world, GhostHarvestable, ghostHarvestable);
  addComponent(game.state.world, Sprite, ghostHarvestable);
  addComponent(game.state.world, Position, ghostHarvestable);
  addComponent(game.state.world, Collider, ghostHarvestable);

  const harvestableSettings = Harvestable[inventoryItem.item.harvestable.name];
  if (!harvestableSettings) return;

  game.state.ghostHarvestableById[ghostHarvestable] = harvestableSettings;

  // Use age 0 sprite for newly placed harvestables
  const spriteName = getSpriteForAge(HarvestableData[inventoryItem.item.harvestable.name], 0);
  const textureMetadata = AllTextureMaps[spriteName] ?? AllTextureMaps[harvestableSettings.name];

  GhostHarvestable(world).itemId[ghostHarvestable] = inventoryItem.item.id;
  Sprite(world).texture[ghostHarvestable] = textureMetadata?.textureId ?? 0;

  // Always use the same sprite dimensions from harvestable settings, regardless of growth stage
  Sprite(world).height[ghostHarvestable] = (harvestableSettings?.spriteHeight ?? harvestableSettings?.height ?? 1) * 16;
  Sprite(world).width[ghostHarvestable] = (harvestableSettings?.spriteWidth ?? harvestableSettings?.width ?? 1) * 16;
  Sprite(world).opacity[ghostHarvestable] = 0.5;
  Sprite(world).dynamicBody[ghostHarvestable] = 1;
  Position(world).x[ghostHarvestable] = 0;
  Position(world).y[ghostHarvestable] = 0;

  // Set up a simple 1-tile collider for placement validation
  // The collider should be centered on the sprite (which is at the cursor position)
  const spriteWidth = Sprite(world).width[ghostHarvestable];
  const spriteHeight = Sprite(world).height[ghostHarvestable];
  Collider(world).sizeWidth[ghostHarvestable] = 16;
  Collider(world).sizeHeight[ghostHarvestable] = 16;
  Collider(world).offsetX[ghostHarvestable] = (spriteWidth - 16) / 2;
  Collider(world).offsetY[ghostHarvestable] = (spriteHeight - 16) / 2;
  Collider(world).static[ghostHarvestable] = 1;

  harvestableBeingPlacedEntityVar(ghostHarvestable);
  harvestableBeingPlacedVar(clone(inventoryItem));

  // Event listeners
  game.input.on('pointerdown', placeHarvestable);
  game.input.keyboard?.once('keydown-ESC', () => cancelPlaceHarvestableIntent());
  game.input.keyboard?.once('keydown-Q', () => cancelPlaceHarvestableIntent());
}
