import EventSystem from "events-system";
import { Building } from "../gameObjects/buildings/Building";
import { Player } from "../gameObjects/player/Player";
import { BuildingItem } from "../gameObjects/item/BuildingItem";
import { ServerPlayer } from "@shared/types/ServerPlayer";

type Events = {
  onBuildingClicked: (building: Building) => void;
  onPlaceBuildingIntent: (building: BuildingItem) => void;
  onPlayerInventoryOpened: (player: Player) => void;
  onPlayerInventoryClosed: () => void;
  onPlayerInventoryUpdate: () => void;
  joinWorld: (worldId: string) => void;
  networkLoadWorld: (world: {player: ServerPlayer}) => void;
  networkNewPlayer: (player: ServerPlayer) => void;
  networkPlayerMove: (player: ServerPlayer) => void;
  networkError: (message: string) => void;
  tick: (...args: any) => void;

};
export const events = new EventSystem<Events>();
