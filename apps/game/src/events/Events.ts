import EventSystem from "events-system";
import { Building } from "../gameObjects/buildings/Building";
import { Player } from "../gameObjects/player/Player";
import { BuildingItem } from "../gameObjects/item/BuildingItem";
import { ServerPlayer, ErrorType } from "@shared";


type Events = {
  onBuildingClicked: (building: Building) => void;
  onPlaceBuildingIntent: (building: BuildingItem) => void;
  onPlayerInventoryOpened: (player: Player) => void;
  onPlayerInventoryClosed: () => void;
  onPlayerInventoryUpdate: () => void;
  joinWorld: (worldId: string) => void;
  networkLoadWorld: (world: {player: ServerPlayer, players: ServerPlayer[]}) => void;
  networkNewPlayer: (player: ServerPlayer) => void;
  networkPlayerDisconnect: (player: ServerPlayer) => void;
  networkPlayerMove: (player: ServerPlayer) => void;
  networkPlayerStopMovement: (player: ServerPlayer) => void;
  networkError: (error: {message: string; type: ErrorType}) => void;
  networkTick: (...args: any) => void;
  tick: (...args: any) => void;

};
export const events = new EventSystem<Events>();
