import { gql, useQuery } from '@apollo/client';
import { InventoryType, ServerInventoryItem } from '@shared';
import { ClientPacket, PacketType, RequestMoveInventoryItemPacketData, RequestWorldBuildingChangeOutput } from '@virtcon2/network-packet';
import { DBWorldBuilding } from '@virtcon2/static-game-data';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import Game from '../../../scenes/Game';
import InventoryItem, { InventoryItemPlaceholder, InventoryItemType } from '../../components/inventoryItem/InventoryItem';
import Window from '../../components/window/Window';
import { isWindowOpen, WindowType } from '../../lib/WindowSlice';
import WorldBuildingOutput, { WORLD_BUILDING_OUTPUT_FRAGMENT } from './WorldBuildingOutput';

const WORLD_BUILDING_FRAGMENT = gql`
  fragment WorldBuildingFragment on WorldBuilding {
    id
    x
    y
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
  ${WORLD_BUILDING_OUTPUT_FRAGMENT}
  query WorldBuildingWindow($id: ID!) {
    worldBuilding(id: $id) {
      ...WorldBuildingFragment
      ...WorldBuildingOutputFragment
    }
  }
`;

const WORLD_BUILDING_SUBSCRIPTION = gql`
  ${WORLD_BUILDING_FRAGMENT}
  ${WORLD_BUILDING_OUTPUT_FRAGMENT}
  subscription WorldBuildingWindow($id: ID!) {
    worldBuilding(id: $id) {
      ...WorldBuildingFragment
      ...WorldBuildingOutputFragment
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
          console.log('updateQuery', prev, subscriptionData);
          if (!subscriptionData.data) return prev;
          return subscriptionData.data;
        },
      });
      return unsubscribe;
    }
  }, [data, inspectedWorldBuilding, subscribeToMore, worldBuilding]);

  const onInventoryDropItem = (item: InventoryItemType, slot: number, inventoryId: number) => {
    // Construct network packet to move the item to the new invenory.
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

  const onNewOutputPositionSelected = (pos: { x: number; y: number }) => {
    if (!worldBuilding) return;
    const packet: ClientPacket<RequestWorldBuildingChangeOutput> = {
      data: {
        building_id: worldBuilding.id,
        output_pos_x: pos.x,
        output_pos_y: pos.y,
      },
      packet_type: PacketType.REQUEST_WORLD_BUILDING_CHANGE_OUTPUT,
    };
    Game.network.sendPacket(packet);
  };

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
          </div>
          <div className="flex-1">
            <h2 className="text-2xl">Top view I/O</h2>
            <WorldBuildingOutput onNewPositionSelected={onNewOutputPositionSelected} worldBuildingId={worldBuilding?.id} />
          </div>
        </div>
        <div>
          <h2 className="text-2xl">Inventory</h2>
          <div className="flex flex-row flex-wrap w-full ">
            {worldBuilding?.world_building_inventory.map((item) => {
              console.log('item', item);
              return item && item.item ? (
                <InventoryItem
                  item={item}
                  fromInventoryType={InventoryType.BUILDING}
                  fromInventorySlot={item.slot}
                  fromInventoryId={worldBuilding.id}
                  onClick={function (item: ServerInventoryItem): void {
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
        <div className="justify-self-end place-items-end flex-1 flex">
          <div className="w-full my-3">
            <p className="text-md">Building processing progress </p>
            {/* {activeWorldBuilding ? <ProgressBar now={tickProgress} max={activeBuilding?.processing_ticks || 0} /> : null} */}
          </div>
        </div>
      </div>
    </Window>
  );
}
