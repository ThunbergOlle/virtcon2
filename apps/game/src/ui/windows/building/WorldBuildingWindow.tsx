import { BuildingType, RedisWorldBuilding, ServerInventoryItem } from '@shared';
import { NetworkPacketData, PacketType, RequestWorldBuildingPacket } from '@virtcon2/network-packet';
import { useContext, useEffect, useState } from 'react';
import { events } from '../../../events/Events';
import Game from '../../../scenes/Game';
import Window from '../../components/window/Window';
import { WindowStackContext } from '../../context/window/WindowContext';
import { useForceUpdate } from '../../hooks/useForceUpdate';
import { WindowType } from '../../lib/WindowManager';
import { DBBuilding, get_building_by_id } from '@virtcon2/static-game-data';
import InventoryItem, { InventoryItemPlaceholder, InventoryType } from '../../components/inventoryItem/InventoryItem';

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

  return (
    <Window title="Building Viewer" width={400} height={400} defaultPosition={{ x: 40, y: 40 }} windowType={WindowType.VIEW_BUILDING}>
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <h2 className="text-2xl">Info</h2>
          <p className="text-md">Name: {activeBuilding?.name}</p>
          <p className="text-md">
            Position: {activeWorldBuilding?.x}, {activeWorldBuilding?.y}
          </p>
          <h2 className="text-2xl">Inventory</h2>
          <div className="flex flex-row  flex-wrap w-full ">
            {[...Array(10)]?.map((_, index) => {
              const item = activeWorldBuilding?.world_building_inventory && activeWorldBuilding?.world_building_inventory[index];
              return item ? (
                <InventoryItem item={item} fromInventoryType={InventoryType.BUILDING} onClick={function (item: ServerInventoryItem): void {
                  throw new Error('Function not implemented.');
                } } />
              ) : (
                <InventoryItemPlaceholder onDrop={(item) => console.log("Dropped item") } />
              );
            })}
          </div>
        </div>
        <div className="justify-self-end place-items-end flex-1 flex">
          <div className="w-full my-3">
            <p className="text-md">Building processing progress</p>
            {/* {activeWorldBuilding ? <ProgressBar max={activeWorldBuilding.processingTicks} now={activeWorldBuilding.processingTicks - activeWorldBuilding.processingTicksLeft} /> : null} */}
          </div>
        </div>
      </div>
    </Window>
  );
}
