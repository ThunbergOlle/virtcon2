import EventSystem from "events-system";
import { Building } from "../gameObjects/buildings/Building";
import { Player } from "../gameObjects/player/Player";
import { BuildingItem } from "../gameObjects/item/BuildingItem";
import { ErrorType } from "apps/server/src/errors/errorTypes";
import { ServerPlayer } from "apps/server/src/types/ServerPlayer";


type Events = {
  onBuildingClicked: (building: Building) => void;
  onPlaceBuildingIntent: (building: BuildingItem) => void;
  onPlayerInventoryOpened: (player: Player) => void;
  onPlayerInventoryClosed: () => void;
  onPlayerInventoryUpdate: () => void;
  joinWorld: (worldId: string) => void;
  networkLoadWorld: (world: {player: ServerPlayer, players: ServerPlayer[]}) => void;
  networkNewPlayer: (player: ServerPlayer) => void;
  networkPlayerMove: (player: ServerPlayer) => void;
  networkError: (error: {message: string; type: ErrorType}) => void;
  networkTick: (...args: any) => void;
  tick: (...args: any) => void;

};
export const events = new EventSystem<Events>();
