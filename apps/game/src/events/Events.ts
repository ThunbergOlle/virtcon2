import { ErrorType } from '@shared';
import { LoadWorldPacketData, PlayerInventoryPacketData, WorldBuildingPacketData } from '@virtcon2/network-packet';
import { DBItem } from '@virtcon2/static-game-data';
import EventSystem from 'events-system';

type Events = {
  placeBuildingIntent: (buildingItem: DBItem) => void;
  onInventoryButtonPressed: () => void;
  onCrafterButtonPressed: () => void;
  onPlayerMenuOpened: () => void;
  onBuildingPressed: (buildingId: number) => void;
  joinWorld: (worldId: string) => void;
  networkLoadWorld: (data: LoadWorldPacketData) => void;
  networkPlayerInventoryPacket: (playerInventoryPacket: PlayerInventoryPacketData) => void;
  networkWorldBuilding: (worldBuildingPacket: WorldBuildingPacketData) => void;
  networkError: (error: { message: string; type: ErrorType }) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _: (...args: any) => void;
};
export const events = new EventSystem<Events>();
