import { ErrorType, ServerPlayer } from "@shared";
import EventSystem from "events-system";
import { Building } from "../gameObjects/buildings/Building";
import { BuildingItem } from "../gameObjects/item/BuildingItem";
import { Player } from "../gameObjects/player/Player";
import { DisconnectPacketData, LoadWorldPacketData, NewPlayerPacketData, PlayerMovePacketData } from "@virtcon2/network-packet";


type Events = {
  onBuildingClicked: (building: Building) => void;
  onPlaceBuildingIntent: (building: BuildingItem) => void;
  onPlaceBuildingIntentCancelled: () => void;
  onPlayerInventoryOpened: (player: Player) => void;
  onPlayerInventoryClosed: () => void;
  onPlayerInventoryUpdate: () => void;
  onPlayerMenuOpened: () => void;
  joinWorld: (worldId: string) => void;
  networkLoadWorld: (data: LoadWorldPacketData) => void;
  networkNewPlayer: (player: NewPlayerPacketData) => void;
  networkDisconnect: (player: DisconnectPacketData) => void;
  networkPlayerMove: (data: PlayerMovePacketData) => void;
  networkPlayerSetPosition: (player: PlayerMovePacketData) => void;
  networkError: (error: {message: string; type: ErrorType}) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  networkTick: (...args: any) => void;
};
export const events = new EventSystem<Events>();
