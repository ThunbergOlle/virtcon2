import { ServerInventoryItem } from '@shared';
import { useEffect, useRef, useState } from 'react';
import { events } from '../../../events/Events';
import Window from '../../components/window/Window';
import { WindowManager, WindowType } from '../../lib/WindowManager';
import { NetworkPacketData, PacketType, RequestPlayerInventoryPacket } from '@virtcon2/network-packet';
import Game from '../../../scenes/Game';
export default function PlayerInventoryWindow(props: { windowManager: WindowManager }) {
  const isOpen = useRef(false);
  const [inventory, setInventory] = useState<Array<ServerInventoryItem>>([]);

  useEffect(() => {
    events.subscribe('onInventoryButtonPressed', () => {
      if (!isOpen.current) {
        /* Send request inventory packet */
        const packet: NetworkPacketData<RequestPlayerInventoryPacket> = {
          data: {},
          packet_type: PacketType.REQUEST_PLAYER_INVENTORY,
        };
        Game.network.sendPacket(packet);
        props.windowManager.openWindow(WindowType.VIEW_PLAYER_INVENTORY);
        isOpen.current = true;
      } else {
        props.windowManager.closeWindow(WindowType.VIEW_PLAYER_INVENTORY);
        isOpen.current = false;
      }
    });
    events.subscribe('networkPlayerInventoryPacket', ({ inventory }) => {
      setInventory(inventory);
    });

    return () => {
      events.unsubscribe('onInventoryButtonPressed', () => {});
      events.unsubscribe('networkPlayerInventoryPacket', () => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Window windowManager={props.windowManager} title="Inventory" width={800} height={800} defaultPosition={{ x: window.innerWidth / 2 - 400, y: 40 }} windowType={WindowType.VIEW_PLAYER_INVENTORY}>
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <h2 className="text-2xl">Inventory</h2>
          <div className="flex flex-row flex-wrap">
            {inventory.map((inventoryItem) => {
              return (
                <div
                  onClick={() => {
                    // NOTE: Should maybe be removed in future.
                    // if (item instanceof BuildingItem) {
                    //   events.notify('onPlaceBuildingIntent', item);
                    // }
                  }}
                  key={inventoryItem.id}
                  className="flex flex-col m-2 text-center w-16 h-16 bg-[#282828] cursor-pointer border-2 border-[#282828] hover:border-[#4b4b4b] hover:bg-[#4b4b4b]"
                >
                  <img alt={inventoryItem.item.display_name} className="flex-1 pixelart w-12  m-auto" src={`/assets/sprites/items/${inventoryItem.item.name}.png`}></img>
                  <p className="flex-1 m-[-8px]">x{inventoryItem.quantity}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Window>
  );
}
