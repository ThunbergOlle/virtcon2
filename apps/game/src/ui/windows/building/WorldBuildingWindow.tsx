import { InventoryType, RedisWorldBuilding, ServerInventoryItem } from '@shared';
import { ClientPacket, PacketType, RequestMoveInventoryItemPacketData, RequestWorldBuildingChangeOutput } from '@virtcon2/network-packet';
import { DBBuilding, DBWorldBuilding, get_building_by_id } from '@virtcon2/static-game-data';
import { useEffect, useState } from 'react';
import { ProgressBar } from 'react-bootstrap';
import { events } from '../../../events/Events';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import Game from '../../../scenes/Game';
import InventoryItem, { InventoryItemPlaceholder, InventoryItemType } from '../../components/inventoryItem/InventoryItem';
import Window from '../../components/window/Window';
import { isWindowOpen, WindowType } from '../../lib/WindowSlice';
import WorldBuildingOutput from './WorldBuildingOutput';
import useTickProgress from './useTickProgress';
import { gql, useQuery } from '@apollo/client';

const WORLD_BUILDING_QUERY = gql`
  query WorldBuildingWindow($id: ID!) {
    worldBuilding(id: $id) {
      x
      y
      output_pos_x
      output_pos_y
      building {
        id
        name
      }
    }
  }
`;

const WORLD_BUILDING_SUBSCRIPTION = gql`
  subscription WorldBuildingWindow($id: ID!) {
    inspectWorldBuilding(id: $id) {
      x
      y
      output_pos_x
      output_pos_y
      building {
        id
        name
      }
    }
  }
`;

export default function WorldBuildingWindow() {
  const dispatch = useAppDispatch();

  const isOpen = useAppSelector((state) => isWindowOpen(state, WindowType.VIEW_BUILDING));
  const inspectedWorldBuilding = useAppSelector((state) => state.inspectedBuilding.inspectedWorldBuildingId);

  const { subscribeToMore, data } = useQuery<{ worldBuilding: DBWorldBuilding }>(WORLD_BUILDING_QUERY, {
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
  }, [data]);

  // const tickProgress = useTickProgress(inspectedWorldBuilding);

  // useEffect(() => {
  //   if (!isOpen) dispatch(doneInspectingBuilding());
  // }, [dispatch, isOpen]);

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
    <Window title="Building Viewer" width={500} height={500} defaultPosition={{ x: 40, y: 40 }} windowType={WindowType.VIEW_BUILDING}>
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
            <WorldBuildingOutput
              width={worldBuilding?.building?.width || 0}
              height={worldBuilding?.building?.height || 0}
              relativePosition={{
                x: worldBuilding?.x || 0,
                y: worldBuilding?.y || 0,
              }}
              onNewPositionSelected={onNewOutputPositionSelected}
              currentOutputPosition={{
                x: worldBuilding?.output_pos_x || 0,
                y: worldBuilding?.output_pos_y || 0,
              }}
              outputBuildingId={worldBuilding?.output_world_building?.id || null}
            />
          </div>
        </div>
        <div>
          <h2 className="text-2xl">Inventory</h2>
          <div className="flex flex-row flex-wrap w-full ">
            {worldBuilding?.world_building_inventory
              ?.sort((a, b) => a.slot - b.slot)
              .map((item) => {
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
