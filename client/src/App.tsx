import "bootstrap/dist/css/bootstrap.min.css";
import 'react-contexify/ReactContexify.css';

import { useState } from "react";
import "./App.css";

import {
  WindowManager,
  WindowStack,
  WindowType,
  windowManager,
} from "./ui/lib/WindowManager";
import BuildingWindow from "./ui/windows/building/BuildingWindow";
import PlayerInventoryWindow from "./ui/windows/playerInventory/PlayerInventory";


function App() {
  const [stack, setStack] = useState<WindowStack[]>([]); // A stack contains an array of windows with an index.

  const openWindow = (windowType: WindowType) => {
    const newStack = windowManager.openWindow(windowType, stack);
    setStack([...newStack]);
  };
  const closeWindow = (windowType: WindowType) => {
    setStack([...windowManager.closeWindow(windowType, stack)]);
  };
  const isOpen = (windowType: WindowType) => {
    return windowManager.isOpen(windowType, stack);
  };
  const selectWindow = (windowType: WindowType) => {
    setStack([...windowManager.selectWindow(windowType, stack)]);
  };
  const getClass = (windowType: WindowType) => {
    return windowManager.getClass(windowType, stack);
  };
  const registerWindow = (windowType: WindowType) => {
    setStack([...windowManager.registerWindow(windowType, stack)]);
  };

  

  const windowManagerObj: WindowManager = {
    openWindow,
    closeWindow,
    isOpen,
    selectWindow,
    getClass,
    registerWindow,
    stack,
  };
  return (
    <div className="App">
      <BuildingWindow windowManager={windowManagerObj}></BuildingWindow>
      <PlayerInventoryWindow
        windowManager={windowManagerObj}
      ></PlayerInventoryWindow>
    </div>
  );
}

export default App;
