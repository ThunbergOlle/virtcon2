import { ErrorType } from "@shared";
import { DisconnectPacketData, LoadWorldPacketData, NewPlayerPacketData, PlayerInventoryPacketData, PlayerMovePacketData } from "@virtcon2/network-packet";
import EventSystem from "events-system";
import { Player } from "../gameObjects/player/Player";


type Events = {
  onPlayerInventoryOpened: (player: Player) => void;
  onPlayerInventoryClosed: () => void;
  onPlayerMenuOpened: () => void;
  joinWorld: (worldId: string) => void;
  networkLoadWorld: (data: LoadWorldPacketData) => void;
  networkPlayerInventoryPacket: (playerInventoryPacket: PlayerInventoryPacketData) => void;
  networkError: (error: {message: string; type: ErrorType}) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _: (...args: any) => void;
};
export const events = new EventSystem<Events>();
