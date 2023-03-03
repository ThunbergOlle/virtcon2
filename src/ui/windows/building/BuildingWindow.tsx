import { useEffect, useState } from "react";
import { events } from "../../../events/Events";
import { Building } from "../../../gameObjects/factory/Building";
import Window from "../../components/window/Window";
import { WindowManagerFunctions, WindowType } from "../../lib/WindowManager";

export default function BuildingWindow(props: {
  windowManager: WindowManagerFunctions;
}) {
  const [activeBuilding, setActiveBuilding] = useState<Building | null>(null);
  useEffect(() => {
    events.subscribe("onBuildingClicked", (building) => {
      setActiveBuilding(building);
      props.windowManager.openWindow(WindowType.VIEW_BUILDING);
    });
    return () => {
      events.unsubscribe("onBuildingClicked", () => {});
    };
  }, []);

  return (
    <Window
      windowManager={props.windowManager}
      title="Building Viewer"
      width={400}
      height={400}
      defaultPosition={{ x: 40, y: 40 }}
      windowType={WindowType.VIEW_BUILDING}
    >
      <div>{activeBuilding?.buildingType}</div>
      <h2>Inventory</h2>
      {activeBuilding?.getInventory().map((item) => {
        return <div key={item.type}>
          <img style={{marginRight: 10}} src={"assets/sprites/items/" + item.type + ".png"}></img>
          {item.type}: x{item.amount}
          </div>;
      })}
    </Window>
  );
}
