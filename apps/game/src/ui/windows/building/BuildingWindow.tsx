import { useEffect, useState } from 'react';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { events } from '../../../events/Events';
import Window from '../../components/window/Window';
import { WindowManager, WindowType, windowManager } from '../../lib/WindowManager';
import { useForceUpdate } from '../../hooks/useForceUpdate';

export default function BuildingWindow(props: { windowManager: WindowManager }) {
  const [activeBuilding, setActiveBuilding] = useState<Building | null>(null);
  const forceUpdate = useForceUpdate();

  useEffect(() => {
    events.subscribe('onBuildingClicked', (building) => {
      setActiveBuilding(building);
      props.windowManager.openWindow(WindowType.VIEW_BUILDING);
    });
    return () => {
      events.unsubscribe('onBuildingClicked', () => {});
    };
  }, []);

  return (
    <Window windowManager={props.windowManager} title="Building Viewer" width={400} height={400} defaultPosition={{ x: 40, y: 40 }} windowType={WindowType.VIEW_BUILDING}>
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <h2 className="text-2xl">Info</h2>
          <p className="text-md">Name: {activeBuilding?.buildingType}</p>
          <p className="text-md">
            Pos: {activeBuilding?.x}, {activeBuilding?.y}
          </p>
          <h2 className="text-2xl">Inventory</h2>
          <p>
            {activeBuilding?.getCurrentInventorySize() ?? 0} / {activeBuilding?.inventorySize ?? 0}
          </p>
          {activeBuilding?.getInventory().map((item) => {
            return (
              <div key={item.type}>
                <img alt={item.type} className="mr-2 inline-block" src={'/assets/sprites/items/' + item.type + '.png'}></img>
                {item.type}: x{item.amount}
              </div>
            );
          })}
        </div>
        <div className="justify-self-end place-items-end flex-1 flex">
          <div className="w-full my-3">
            <p className="text-md">Building processing progress</p>
            {activeBuilding ? <ProgressBar max={activeBuilding.processingTicks} now={activeBuilding.processingTicks - activeBuilding.processingTicksLeft} /> : null}
          </div>
        </div>
      </div>
    </Window>
  );
}
