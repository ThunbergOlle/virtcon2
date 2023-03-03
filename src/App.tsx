import { useEffect } from "react";
import "./App.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useWindowManager } from "./ui/lib/WindowManager";
import BuildingWindow from "./ui/windows/building/BuildingWindow";
import { events } from "./events/Events";

function App() {
 
  const windowManager = useWindowManager();
  
  useEffect(() => {
    events.subscribe("tick", () => {
      windowManager.reRenderWindow();
    });
  }, []);

  return (
    <div className="App">
      <BuildingWindow windowManager={windowManager}></BuildingWindow>
    </div>
  );
}

export default App;
