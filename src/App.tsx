import { useEffect, useRef, useState } from "react";
import "./App.css";
import { events } from "./events/Events";
import Window from "./ui/components/window/Window";
import { WindowStack, WindowType } from "./ui/lib/WindowManager";
import { Building } from "./gameObjects/factory/Building";

function App() {
  const [openWindows, setOpenWindows] = useState<{
    [key in WindowType]?: boolean;
  }>({
    [WindowType.VIEW_BUILDING]: false,
  });
  const windowStack = useRef(new WindowStack());

  const [activeBuilding, setActiveBuilding] = useState<Building | null>(null)
  useEffect(() => {
    events.subscribe("onBuildingClicked", (building) => {
      console.log("building was clicked, received in react ui");
      setActiveBuilding(building);
      selectWindow(WindowType.VIEW_BUILDING);
      
    });
    return () => {
      events.unsubscribe("onBuildingClicked", () => {});
    };
  }, []);
  const selectWindow = (window: WindowType) => {
    setOpenWindows({
      [window]: true,
    });
    windowStack.current.selectWindow(window);
  }
  const closeWindow =(window: WindowType) =>  {
    setOpenWindows({
      [window]: false,
    });
    
  }
  return (
    <div className="App">
      <Window
        title="Building Viewer"
        onFocus={selectWindow}
        onClose={closeWindow}
        width={400}
        height={400}
        defaultPosition={{ x: 40, y: 40 }}
        isOpen={openWindows[WindowType.VIEW_BUILDING]!}
        className={windowStack.current.getClass(WindowType.VIEW_BUILDING)}
        windowType={WindowType.VIEW_BUILDING}
      >
        <div>{activeBuilding?.buildingType}</div>
        <h2>Inventory</h2>
        {activeBuilding?.getInventory().map((item) => {
          return <div>{item.type}</div>;
        })
        }
      </Window>
    </div>
  );
}

export default App;
