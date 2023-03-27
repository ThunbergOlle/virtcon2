import { ErrorType, ServerPlayer } from "@shared";
import EventSystem from "events-system";
import { Building } from "../gameObjects/buildings/Building";
import { BuildingItem } from "../gameObjects/item/BuildingItem";
import { Player } from "../gameObjects/player/Player";
import { PlayerMovePacketData } from "@virtcon2/network-packet";


type Events = {
  onBuildingClicked: (building: Building) => void;
  onPlaceBuildingIntent: (building: BuildingItem) => void;
  onPlayerInventoryOpened: (player: Player) => void;
  onPlayerInventoryClosed: () => void;
  onPlayerInventoryUpdate: () => void;
  joinWorld: (worldId: string) => void;
  networkLoadWorld: (data: {player: ServerPlayer, players: ServerPlayer[]}) => void;
  networkNewPlayer: (player: ServerPlayer) => void;
  networkPlayerDisconnect: (player: ServerPlayer) => void;
  networkPlayerMove: (data: PlayerMovePacketData) => void;
  networkPlayerSetPosition: (player: ServerPlayer) => void;
  networkError: (error: {message: string; type: ErrorType}) => void;
  networkTick: (...args: any) => void;
  tick: (...args: any) => void;

};
export const events = new EventSystem<Events>();
