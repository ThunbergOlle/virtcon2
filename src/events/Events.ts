import EventSystem from "events-system";
import { Building } from "../gameObjects/buildings/Building";

type Events = {
  onBuildingClicked: (building: Building) => void;
  tick: (...args: any) => void;
};
export const events = new EventSystem<Events>();
