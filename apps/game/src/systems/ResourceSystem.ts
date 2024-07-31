import { ClientPacket, PacketType, RequestDestroyResourcePacket } from '@virtcon2/network-packet';
import { get_item_by_id } from '@virtcon2/static-game-data';
import { Types } from 'phaser';
import { toast } from 'react-toastify';
import Game, { GameState } from '../scenes/Game';
import { Resource, Sprite, Collider } from '@virtcon2/network-world-entities';
import { defineQuery, defineSystem, enterQuery, World } from '@virtcon2/bytenetc';

const resourceQuery = defineQuery(Resource, Sprite, Collider);
const resourceEnterQuery = enterQuery(resourceQuery);
export const createResourceSystem = (world: World) => {
  return defineSystem<GameState>((state) => {
    const enterEntities = resourceEnterQuery(world);

    for (let i = 0; i < enterEntities.length; i++) {
      const id = enterEntities[i];
      const sprite = state.spritesById[id] as Types.Physics.Arcade.SpriteWithDynamicBody;
      // The name is important so we can check what type of resource we collided with just based off the name.
      sprite.setName(`resource-${get_item_by_id(Resource.itemId[id])?.name}`);
      if (sprite) {
        setupResourceEventListeners(sprite, id, state);
      }
    }
    return state;
  });
};

/* TODO: migrate to new architecture */
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
      toast(`+1 ${get_item_by_id(Resource.itemId[eid])?.display_name} added to inventory`, { type: 'success', autoClose: 1000 });
      const destroyResourcePacket: ClientPacket<RequestDestroyResourcePacket> = {
        data: {
          resourceId: Resource.id[eid],
        },
        packet_type: PacketType.REQUEST_DESTROY_RESOURCE,
        world_id: state.world,
      };
      Game.network.sendPacket(destroyResourcePacket);
      Resource.health[eid] = 5;
    }
  });
};
