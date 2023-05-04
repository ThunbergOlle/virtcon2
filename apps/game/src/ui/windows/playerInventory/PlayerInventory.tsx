import { useEffect, useState } from 'react';
import { events } from '../../../events/Events';
import { Player } from '../../../gameObjects/player/Player';
import Window from '../../components/window/Window';
import { useForceUpdate } from '../../hooks/useForceUpdate';
import { WindowManager, WindowType } from '../../lib/WindowManager';

export default function PlayerInventoryWindow(props: { windowManager: WindowManager }) {
  const forceUpdate = useForceUpdate();
  const [player, setPlayer] = useState<Player | null>(null);

  useEffect(() => {
    console.log('Setting up player inventory window listener');
    events.subscribe('onPlayerInventoryOpened', (player) => {
      setPlayer(player);
      props.windowManager.openWindow(WindowType.VIEW_PLAYER_INVENTORY);
    });
    events.subscribe('onPlayerInventoryClosed', () => {
      console.log('onPlayerInventoryClosed');
      setPlayer(null);
      props.windowManager.closeWindow(WindowType.VIEW_PLAYER_INVENTORY);
    });
    events.subscribe('onPlayerInventoryUpdate', () => {
      forceUpdate();
    });

    return () => {
      events.unsubscribe('onPlayerInventoryOpened', () => {});
      events.unsubscribe('onPlayerInventoryClosed', () => {});
    };
  }, []);

  return (
    <Window windowManager={props.windowManager} title="Inventory" width={800} height={800} defaultPosition={{ x: window.innerWidth / 2 - 400, y: 40 }} windowType={WindowType.VIEW_PLAYER_INVENTORY}>
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <h2 className="text-2xl">Inventory</h2>
          <p>
            {player?.getCurrentInventorySize() ?? 0} / {player?.inventorySize ?? 0}
          </p>
          {player?.getInventory().map((inventoryItem) => {
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
                <img
                  alt={inventoryItem.item.name}
                  className="flex-1 pixelart w-12  m-auto"
                  src={`/assets/sprites/${inventoryItem.item.type.includes('building_') ? 'buildings/' + inventoryItem.item.type.substring(9) : 'items/' + inventoryItem.item.type}.png`}
                ></img>
                <p className="flex-1 m-[-8px]">x{inventoryItem.quantity}</p>
              </div>
            );
          })}
        </div>
      </div>
    </Window>
  );
}
