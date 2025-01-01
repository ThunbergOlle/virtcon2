import { ErrorType } from '@shared';
import EventSystem from 'events-system';
import { LoadWorldPacketData, WorldBuildingServerPacket } from '@virtcon2/network-packet';
import { DBItem } from '@virtcon2/static-game-data';

type Events = {
  placeBuildingIntent: (buildingItem: DBItem) => void;
  onInventoryButtonPressed: () => void;
  onCrafterButtonPressed: () => void;
  onPlayerMenuOpened: () => void;
  onBuildingPressed: (buildingId: number) => void;
  joinWorld: (worldId: string) => void;
  networkLoadWorld: (data: LoadWorldPacketData) => void;
  networkPlayerInventory: (playerInventory: PlayerInventoryServerPacket) => void;
  networkWorldBuilding: (worldBuildingPacket: WorldBuildingServerPacket) => void;

  networkError: (error: { message: string; type: ErrorType }) => void;
};
export const events = new EventSystem<Events>();
