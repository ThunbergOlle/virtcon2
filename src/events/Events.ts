import EventSystem from "events-system";
import { Building } from "../gameObjects/factory/Building";

type Events = {
  onBuildingClicked: (building: Building) => void;
};
export const events = new EventSystem<Events>();
