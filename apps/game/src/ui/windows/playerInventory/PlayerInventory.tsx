import { ServerInventoryItem } from '@shared';
import { useEffect, useState } from 'react';
import { events } from '../../../events/Events';
import Window from '../../components/window/Window';
import { WindowManager, WindowType } from '../../lib/WindowManager';

export default function PlayerInventoryWindow(props: { windowManager: WindowManager }) {
  const [inventory, setInventory] = useState<Array<ServerInventoryItem>>([]);

  useEffect(() => {
    console.log('Setting up player inventory window listener');
    events.subscribe('onPlayerInventoryOpened', (player) => {
      if (player.getInventory().length) {
        setInventory(player.getInventory());
      }
      props.windowManager.openWindow(WindowType.VIEW_PLAYER_INVENTORY);
    });
    events.subscribe('onPlayerInventoryClosed', () => {
      props.windowManager.closeWindow(WindowType.VIEW_PLAYER_INVENTORY);
    });
    events.subscribe('networkPlayerInventoryPacket', ({ inventory }) => {
      setInventory(inventory);
    });

    return () => {
      events.unsubscribe('onPlayerInventoryOpened', () => {});
      events.unsubscribe('onPlayerInventoryClosed', () => {});
      events.unsubscribe('networkPlayerInventoryPacket', () => {});
    };
  }, []);

  return (
    <Window windowManager={props.windowManager} title="Inventory" width={800} height={800} defaultPosition={{ x: window.innerWidth / 2 - 400, y: 40 }} windowType={WindowType.VIEW_PLAYER_INVENTORY}>
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <h2 className="text-2xl">Inventory</h2>
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
                className="flex flex-col text-center w-16 h-16 bg-[#282828] cursor-pointer border-2 border-[#282828] hover:border-[#4b4b4b] hover:bg-[#4b4b4b]"
              >
                <img alt={inventoryItem.item.name} className="flex-1 pixelart w-12  m-auto" src={`/assets/sprites/items/${inventoryItem.item.display_name}.png`}></img>
                <p className="flex-1 m-[-8px]">x{inventoryItem.quantity}</p>
              </div>
            );
          })}
        </div>
      </div>
    </Window>
  );
}
