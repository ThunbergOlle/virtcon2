import { defineQuery, defineSerializer, removeEntity, World } from '@virtcon2/bytenetc';
import { PacketType } from '@virtcon2/network-packet';
import { getSerializeConfig, SerializationID, WorldBorder } from '@virtcon2/network-world-entities';
import { io } from '../app';
import { getWorldBounds, initialiseWorldBounds } from '../ecs/entityWorld';
import { SERVER_SENDER } from '../packet/utils';

export const onExpandPlotEvent = async (world: World) => {
  const borderQuery = defineQuery(WorldBorder);
  const oldBorderEntities = borderQuery(world);

  const removedEntities = [...oldBorderEntities];
  for (const border of oldBorderEntities) removeEntity(world, border);

  const bounds = await getWorldBounds(world);
  await initialiseWorldBounds(world, bounds);

  const newBorderEntities = borderQuery(world);
  const serializeBorders = defineSerializer(getSerializeConfig(world)[SerializationID.WORLD_BORDER]);
  const serializedBorders = serializeBorders(world, newBorderEntities);

  io.sockets.to(world).emit('packets', [
    {
      packet_type: PacketType.REMOVE_ENTITY,
      target: world,
      data: {
        packet_type: PacketType.REMOVE_ENTITY,
        entityIds: removedEntities,
      },
      sender: SERVER_SENDER,
    },
    {
      packet_type: PacketType.SYNC_SERVER_ENTITY,
      target: world,
      data: {
        serializationId: SerializationID.WORLD_BORDER,
        data: serializedBorders,
      },
      sender: SERVER_SENDER,
    },
  ]);
};
