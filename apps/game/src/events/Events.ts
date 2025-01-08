import { ErrorType } from '@shared';
import EventSystem from 'events-system';
import { LoadWorldPacketData } from '@virtcon2/network-packet';
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

  networkError: (error: { message: string; type: ErrorType }) => void;
};
export const events = new EventSystem<Events>();
