import EventSystem from "events-system";
import { Building } from "../gameObjects/buildings/Building";
import { Player } from "../gameObjects/player/Player";
import { BuildingItem } from "../gameObjects/item/BuildingItem";

type Events = {
  onBuildingClicked: (building: Building) => void;
  onPlaceBuildingIntent: (building: BuildingItem) => void;
  onPlayerInventoryOpened: (player: Player) => void;
  onPlayerInventoryClosed: () => void;
  onPlayerInventoryUpdate: () => void;
  tick: (...args: any) => void;
};
export const events = new EventSystem<Events>();
