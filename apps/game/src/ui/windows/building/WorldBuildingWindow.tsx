import { gql, useQuery } from '@apollo/client';
import { ClientPacket, InventoryType, PacketType, RequestMoveInventoryItemPacketData } from '@virtcon2/network-packet';
import { DBWorldBuilding } from '@virtcon2/static-game-data';
import { prop, sortBy } from 'ramda';
import { useEffect } from 'react';
import { useAppSelector } from '../../../hooks';
import Game from '../../../scenes/Game';
import InventoryItem, { InventoryItemPlaceholder, InventoryItemType } from '../../components/inventoryItem/InventoryItem';
import Window from '../../components/window/Window';
import { WindowType } from '../../lib/WindowSlice';
import { WorldBuildingConnection } from './WorldBuildingConnection';

const WORLD_BUILDING_FRAGMENT = gql`
  fragment WorldBuildingFragment on WorldBuilding {
    id
    x
    y
    rotation
    building {
      id
      name
    }
    world_building_inventory {
      slot
      quantity
      item {
        id
        display_name
      }
    }
  }
`;

const WORLD_BUILDING_QUERY = gql`
  ${WORLD_BUILDING_FRAGMENT}
  query WorldBuildingWindow($id: ID!) {
    worldBuilding(id: $id) {
      ...WorldBuildingFragment
    }
  }
`;

const WORLD_BUILDING_SUBSCRIPTION = gql`
  ${WORLD_BUILDING_FRAGMENT}
  subscription WorldBuildingWindow($id: ID!) {
    worldBuilding(id: $id) {
      ...WorldBuildingFragment
    }
  }
`;

export default function WorldBuildingWindow() {
  const inspectedWorldBuilding = useAppSelector((state) => state.inspectedBuilding.inspectedWorldBuildingId);

  const { subscribeToMore, data, loading } = useQuery<{ worldBuilding: DBWorldBuilding }>(WORLD_BUILDING_QUERY, {
    variables: { id: inspectedWorldBuilding },
    skip: !inspectedWorldBuilding,
  });

  const worldBuilding = data?.worldBuilding;

  useEffect(() => {
    if (worldBuilding) {
      const unsubscribe = subscribeToMore({
        document: WORLD_BUILDING_SUBSCRIPTION,
        variables: { id: inspectedWorldBuilding },
        updateQuery: (prev, { subscriptionData }) => {
          if (!subscriptionData.data) return prev;
          return subscriptionData.data;
        },
      });
      return unsubscribe;
    }
  }, [data, inspectedWorldBuilding, subscribeToMore, worldBuilding]);

  const onInventoryDropItem = (item: InventoryItemType, slot: number, inventoryId: number) => {
    const packet: ClientPacket<RequestMoveInventoryItemPacketData> = {
      data: {
        ...item,
        toInventoryId: inventoryId,
        toInventoryType: InventoryType.BUILDING,
        toInventorySlot: slot,
      },
      packet_type: PacketType.REQUEST_MOVE_INVENTORY_ITEM,
    };
    Game.network.sendPacket(packet);
  };

  const inventorySorted = sortBy(prop('slot'))(worldBuilding?.world_building_inventory ?? []);

  return (
    <Window
      title="Building Viewer"
      fullWindowLoading={loading}
      width={500}
      height={500}
      defaultPosition={{ x: 40, y: 40 }}
      windowType={WindowType.VIEW_BUILDING}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-row">
          <div className="flex-1">
            <h2 className="text-2xl">Info</h2>
            <p className="text-md">Name: {worldBuilding?.building?.name}</p>
            <p className="text-md">ID (dev): {worldBuilding?.id}</p>
            <p className="text-md">
              Position: {worldBuilding?.x}, {worldBuilding?.y}
            </p>
            <p className="text-md">Rotation: {worldBuilding?.rotation}°</p>
          </div>
        </div>

        <div className="flex-[3]">
          <h2 className="text-2xl">Inventory</h2>
          <div className="flex flex-row flex-wrap gap-2">
            {worldBuilding &&
              inventorySorted.map((item) => {
                return item && item.item ? (
                  <InventoryItem
                    inventoryItem={item}
                    fromInventoryType={InventoryType.BUILDING}
                    fromInventorySlot={item.slot}
                    fromInventoryId={worldBuilding.id}
                    onClick={function (): void {
                      throw new Error('Function not implemented.');
                    }}
                    slot={item.slot}
                    onDrop={onInventoryDropItem}
                    key={item.slot}
                  />
                ) : (
                  <InventoryItemPlaceholder key={item.slot} inventoryId={worldBuilding.id} slot={item.slot} onDrop={onInventoryDropItem} />
                );
              })}
          </div>
        </div>
        <WorldBuildingConnection x={worldBuilding?.x ?? 0} y={worldBuilding?.y ?? 0} />
      </div>
    </Window>
  );
}
