import "./App.css";
import { useWindowManager } from "./ui/lib/WindowManager";
import BuildingWindow from "./ui/windows/building/BuildingWindow";

function App() {
 
  const windowManager = useWindowManager();
  

  return (
    <div className="App">
      <BuildingWindow windowManager={windowManager}></BuildingWindow>
    </div>
  );
}

export default App;
