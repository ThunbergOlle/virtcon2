import EventSystem from "events-system";
import { Building } from "../gameObjects/buildings/Building";
import { Player } from "../gameObjects/player/Player";

type Events = {
  onBuildingClicked: (building: Building) => void;
  onPlayerInventoryOpened: (player: Player) => void;
  onPlayerInventoryClosed: () => void;
  onPlayerInventoryUpdate: () => void;
  tick: (...args: any) => void;
};
export const events = new EventSystem<Events>();
