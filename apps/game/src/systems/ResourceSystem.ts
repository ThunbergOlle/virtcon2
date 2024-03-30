import { ResourceNames, Resources, get_item_by_id } from '@virtcon2/static-game-data';
import { IWorld, addComponent, addEntity, defineQuery, defineSystem, enterQuery } from '@virtcon2/virt-bit-ecs';
import { Position } from '../components/Position';
import { Sprite } from '../components/Sprite';
import { TileCoordinates, toPhaserPos } from '../ui/lib/coordinates';
import { Collider } from '../components/Collider';
import Game, { GameObjectGroups, GameState } from '../scenes/Game';
import { Resource } from '../components/Resource';
import { Types } from 'phaser';
import { RequestDestroyResourcePacket, ClientPacket, PacketType } from '@virtcon2/network-packet';
import { toast } from 'react-toastify';
import { AllTextureMaps } from '../config/SpriteMap';

const resourceQuery = defineQuery([Resource, Sprite, Collider]);
const resourceEnterQuery = enterQuery(resourceQuery);
export const createResourceSystem = () => {
  return defineSystem((world: IWorld, state: GameState, packets) => {
    const enterEntities = resourceEnterQuery(world);

    for (let i = 0; i < enterEntities.length; i++) {
      const id = enterEntities[i];
      const sprite = state.spritesById[id] as Types.Physics.Arcade.SpriteWithDynamicBody;
      // The name is important so we can check what type of resource we collided with just based off the name.
      sprite.setName(`resource-${state.resourcesById[id].item.name}`);
      if (sprite) {
        setupResourceEventListeners(sprite, id, state);
      }
    }
    return { world, state };
  });
};
const setupResourceEventListeners = (sprite: Types.Physics.Arcade.SpriteWithDynamicBody, eid: number, state: GameState) => {
  if (!sprite.body) {
    console.error(`No body for resource ${eid}`);
    return;
  }
  sprite.body.gameObject.on(Phaser.Input.Events.POINTER_DOWN, () => {
    // tint the resource red to indicate that it is being damanged
    sprite.setTint(0xff0000);
    setTimeout(() => {
      sprite.clearTint();
    }, 100);
    /* Future security improvements:  Send resource damage package.*/
    /* Currently, backend does not check if the destroy resource is legit. */
    Resource.health[eid] -= 1;
    if (Resource.health[eid] <= 0) {
      // send resource destroy packet
      toast(`+1 ${get_item_by_id(state.resourcesById[eid].item.id)?.display_name} added to inventory`, { type: 'success', autoClose: 1000 });
      const destroyResourcePacket: ClientPacket<RequestDestroyResourcePacket> = {
        data: {
          resourceId: state.resourcesById[eid].id,
        },
        packet_type: PacketType.REQUEST_DESTROY_RESOURCE,
        world_id: state.world_id,
      };
      Game.network.sendPacket(destroyResourcePacket);
      Resource.health[eid] = 5;
    }
  });
};
export const createNewResourceEntity = (
  world: IWorld,
  data: {
    resourceName: ResourceNames;
    pos: TileCoordinates;
  },
): number => {
  const { x, y } = toPhaserPos({ x: data.pos.x, y: data.pos.y });
  const resource = addEntity(world);

  addComponent(world, Position, resource);
  Position.x[resource] = x;
  Position.y[resource] = y;

  addComponent(world, Sprite, resource);
  Sprite.texture[resource] = AllTextureMaps[data.resourceName]?.textureId ?? 0;

  addComponent(world, Collider, resource);
  Collider.sizeWidth[resource] = Resources[data.resourceName].width * 16;
  Collider.sizeHeight[resource] = Resources[data.resourceName].height * 16;
  Collider.offsetX[resource] = 0;
  Collider.offsetY[resource] = 0;
  Collider.static[resource] = 1;
  Collider.group[resource] = GameObjectGroups.RESOURCE;

  addComponent(world, Resource, resource);
  Resource.health[resource] = 5;

  return resource;
};
