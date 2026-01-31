import { InvalidStateError } from '@shared';
import { defineQuery, defineSerializer, removeEntity } from '@virtcon2/bytenetc';
import { ClientPacketWithSender, RequestDestroyHarvestablePacket } from '@virtcon2/network-packet';
import { createItem, Position, Harvestable, SerializationID, getSerializeConfig, Player } from '@virtcon2/network-world-entities';
import { getHarvestableByItem, get_item_by_id, isHarvestableMature } from '@virtcon2/static-game-data';
import { clone } from 'ramda';
import { syncServerEntities, syncRemoveEntities } from '../enqueue';

export default async function request_destroy_harvestable_packet(packet: ClientPacketWithSender<RequestDestroyHarvestablePacket>) {
  const playerQuery = defineQuery(Player, Position);
  const playerEntities = playerQuery(packet.world_id);
  const playerEid = playerEntities.find((eid) => Player(packet.world_id).userId[eid] === packet.sender.id);

  const world = packet.world_id;
  const harvestableEid = packet.data.harvestableEntityId;

  const seedItemId = Harvestable(world).itemId[harvestableEid];
  const dropCount = Harvestable(world).dropCount[harvestableEid];
  const age = Harvestable(world).age[harvestableEid];

  const seedItem = get_item_by_id(seedItemId);
  if (!seedItem) throw new InvalidStateError(`Item with ID ${seedItemId} not found in static game data.`);

  const harvestableData = getHarvestableByItem(seedItem.name);

  if (!harvestableData) throw new InvalidStateError(`Harvestable data for item ID ${seedItemId} not found.`);

  const newItemIds = [];

  if (isHarvestableMature(harvestableData.name, age)) {
    for (let i = 0; i < dropCount; i++) {
      const [harvestableX, harvestableY] = [Position(world).x[harvestableEid], Position(world).y[harvestableEid]];
      let [x, y] = clone([Position(world).x[playerEid], Position(world).y[playerEid]]);

      x = x + (Math.random() * 16 - 8) * 0.5;
      y = y + (Math.random() * 16 - 8) * 0.5;

      newItemIds.push(
        createItem({
          world: packet.world_id,
          itemId: Harvestable(world).dropItemId[harvestableEid],
          x,
          y,
          droppedFromX: harvestableX,
          droppedFromY: harvestableY,
        }),
      );
    }
  }

  const itemSerialized = defineSerializer(getSerializeConfig(world)[SerializationID.ITEM])(packet.world_id, newItemIds);

  // Remove the harvestable entity
  removeEntity(world, harvestableEid);

  await syncServerEntities(packet.world_id, itemSerialized, SerializationID.ITEM);
  await syncRemoveEntities(packet.world_id, [harvestableEid]);
}
