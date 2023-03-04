import { useEffect, useState } from "react";
import { events } from "../../../events/Events";
import { Player } from "../../../gameObjects/player/Player";
import Window from "../../components/window/Window";
import { WindowManager, WindowType } from "../../lib/WindowManager";

export default function PlayerInventoryWindow(props: {
  windowManager: WindowManager;
}) {
    
  const [player, setPlayer] = useState<Player | null>(null);

  useEffect(() => {
    events.subscribe("onPlayerInventoryOpened", (player => {
      setPlayer(player);
      props.windowManager.openWindow(WindowType.VIEW_PLAYER_INVENTORY);
    }));
    events.subscribe("onPlayerInventoryClosed", (() => {
      console.log("onPlayerInventoryClosed")
      setPlayer(null);
      props.windowManager.closeWindow(WindowType.VIEW_PLAYER_INVENTORY);
    }));

    return () => {
      events.unsubscribe("onPlayerInventoryOpened", () => {});
      events.unsubscribe("onPlayerInventoryClosed", () => {});
    };
  }, []);

  return (
    <Window
      windowManager={props.windowManager}
      title="Inventory"
      width={800}
      height={800}
      defaultPosition={{ x: (window.innerWidth / 2 ) - 400 , y: 40 }}
      windowType={WindowType.VIEW_PLAYER_INVENTORY}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <h2 className="text-2xl">Inventory</h2>
          <p>{(player?.getCurrentInventorySize() ?? 0)} / {(player?.inventorySize ?? 0)}</p>
          {player?.getInventory().map((item) => {
            return (
              <div key={item.type}>
                <img
                  className="mr-2 inline-block"
                  src={"assets/sprites/items/" + item.type + ".png"}
                ></img>
                {item.type}: x{item.amount}
              </div>
            );
          })}
        </div>
        
      </div>
    </Window>
  );
}
