import { InventoryType, RedisWorldBuilding, ServerInventoryItem } from '@shared';
import {
  NetworkPacketData,
  PacketType,
  RequestMoveInventoryItemPacketData,
  RequestWorldBuildingChangeOutput,
  RequestWorldBuildingPacket,
} from '@virtcon2/network-packet';
import { DBBuilding, get_building_by_id } from '@virtcon2/static-game-data';
import { useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { events } from '../../../events/Events';
import Game from '../../../scenes/Game';
import InventoryItem, { InventoryItemPlaceholder, InventoryItemType } from '../../components/inventoryItem/InventoryItem';
import Window from '../../components/window/Window';
import { WindowStackContext } from '../../context/window/WindowContext';
import { useForceUpdate } from '../../hooks/useForceUpdate';
import { WindowType } from '../../lib/WindowManager';
import WorldBuildingOutput from './WorldBuildingOutput';

export default function WorldBuildingWindow() {
  const windowManagerContext = useContext(WindowStackContext);
  const [activeWorldBuilding, setActiveWorldBuilding] = useState<RedisWorldBuilding | null>(null);
  const [activeBuilding, setActiveBuilding] = useState<DBBuilding | null>(null);
  const forceUpdate = useForceUpdate();

  useEffect(() => {
    if (activeWorldBuilding) {
      setActiveBuilding(get_building_by_id(activeWorldBuilding.building.id) || null);
    }
  }, [activeWorldBuilding]);

  function toggleWorldBuildingWindow(buildingId: number) {
    windowManagerContext.setWindowStack({ type: 'open', windowType: WindowType.VIEW_BUILDING });
    /* Send request view building packet */
    const packet: NetworkPacketData<RequestWorldBuildingPacket> = {
      data: {
        building_id: buildingId,
      },
      packet_type: PacketType.REQUEST_WORLD_BUILDING,
    };
    Game.network.sendPacket(packet);
  }

  useEffect(() => {
    events.subscribe('onBuildingPressed', toggleWorldBuildingWindow);
    events.subscribe('networkWorldBuilding', (data) => {
      console.log('networkWorldBuilding', data);
      setActiveWorldBuilding(data.building || null);
      forceUpdate();
    });
    return () => {
      events.unsubscribe('onBuildingPressed', () => {});
      events.unsubscribe('networkWorldBuilding', () => {});
    };
  }, []);
  const onInventoryDropItem = (item: InventoryItemType) => {
    if (!activeWorldBuilding?.id) {
      toast('You must have a building selected to drop items into it.', { type: 'error' });
      return;
    }
    // Construct network packet to move the item to the new invenory.
    const packet: NetworkPacketData<RequestMoveInventoryItemPacketData> = {
      data: {
        ...item,
        toInventoryId: activeWorldBuilding?.id,
        toInventoryType: InventoryType.BUILDING,
      },
      packet_type: PacketType.REQUEST_MOVE_INVENTORY_ITEM,
    };
    Game.network.sendPacket(packet);
  };
  const onNewOutputPositionSelected = (pos: { x: number; y: number }) => {
    if (!activeWorldBuilding) return;
    const packet: NetworkPacketData<RequestWorldBuildingChangeOutput> = {
      data: {
        building_id: activeWorldBuilding.id,
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
            <p className="text-md">Name: {activeBuilding?.name}</p>
            <p className="text-md">
              Position: {activeWorldBuilding?.x}, {activeWorldBuilding?.y}
            </p>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl">Top view I/O</h2>
            <WorldBuildingOutput
              width={activeBuilding?.width || 0}
              height={activeBuilding?.height || 0}
              relativePosition={{
                x: activeWorldBuilding?.x || 0,
                y: activeWorldBuilding?.y || 0,
              }}
              onNewPositionSelected={onNewOutputPositionSelected}
              currentOutputPosition={{
                x: activeWorldBuilding?.output_pos_x || 0,
                y: activeWorldBuilding?.output_pos_y || 0,
              }}
            />
          </div>
        </div>
        <div>
          <h2 className="text-2xl">Inventory</h2>
          <div className="flex flex-row flex-wrap w-full ">
            {[...Array(8)]?.map((_, index) => {
              const item = activeWorldBuilding?.world_building_inventory && activeWorldBuilding?.world_building_inventory[index];
              return item ? (
                <InventoryItem
                  item={item}
                  fromInventoryType={InventoryType.BUILDING}
                  fromInventoryId={activeWorldBuilding.id}
                  onClick={function (item: ServerInventoryItem): void {
                    throw new Error('Function not implemented.');
                  }}
                />
              ) : (
                <InventoryItemPlaceholder onDrop={onInventoryDropItem} />
              );
            })}
          </div>
        </div>
        <div className="justify-self-end place-items-end flex-1 flex">
          <div className="w-full my-3">
            <p className="text-md">Building processing progress</p>
            {/* {activeWorldBuilding ? <Progre  ssBar max={activeWorldBuilding.processingTicks} now={activeWorldBuilding.processingTicks - activeWorldBuilding.processingTicksLeft} /> : null} */}
          </div>
        </div>
      </div>
    </Window>
  );
}
