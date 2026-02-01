import { gql, useQuery } from '@apollo/client';
import { ClientPacket, InventoryType, PacketType, RequestMoveInventoryItemPacketData, RequestPickupBuildingPacketData } from '@virtcon2/network-packet';
import { DBWorldBuilding, WorldBuildingInventorySlotType } from '@virtcon2/static-game-data';
import { prop, sortBy } from 'ramda';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import Game from '../../../scenes/Game';
import InventoryItem, { InventoryItemPlaceholder, InventoryItemGhost, InventoryItemType } from '../../components/inventoryItem/InventoryItem';
import Window from '../../components/window/Window';
import { close, WindowType } from '../../lib/WindowSlice';
import { WorldBuildingConnection } from './WorldBuildingConnection';

const WORLD_BUILDING_FRAGMENT = gql`
  fragment WorldBuildingFragment on WorldBuilding {
    id
    x
    y
    rotation
    building {
      id
      name
      processing_requirements {
        id
        quantity
        item {
          id
          display_name
          name
        }
      }
      fuel_requirements {
        id
        quantity
        item {
          id
          display_name
          name
        }
      }
    }
    world_building_inventory {
      slot
      quantity
      slotType
      item {
        id
        display_name
        name
      }
    }
  }
`;

const WORLD_BUILDING_QUERY = gql`
  ${WORLD_BUILDING_FRAGMENT}
  query WorldBuildingWindow($id: ID!) {
    worldBuilding(id: $id) {
      ...WorldBuildingFragment
    }
  }
`;

const WORLD_BUILDING_SUBSCRIPTION = gql`
  ${WORLD_BUILDING_FRAGMENT}
  subscription WorldBuildingWindow($id: ID!) {
    worldBuilding(id: $id) {
      ...WorldBuildingFragment
    }
  }
`;

export default function WorldBuildingWindow() {
  const dispatch = useAppDispatch();
  const inspectedWorldBuilding = useAppSelector((state) => state.inspectedBuilding.inspectedWorldBuildingId);

  const { subscribeToMore, data, loading } = useQuery<{ worldBuilding: DBWorldBuilding }>(WORLD_BUILDING_QUERY, {
    variables: { id: inspectedWorldBuilding },
    skip: !inspectedWorldBuilding,
  });

  const worldBuilding = data?.worldBuilding;

  useEffect(() => {
    if (worldBuilding) {
      const unsubscribe = subscribeToMore({
        document: WORLD_BUILDING_SUBSCRIPTION,
        variables: { id: inspectedWorldBuilding },
        updateQuery: (prev, { subscriptionData }) => {
          if (!subscriptionData.data) return prev;
          return subscriptionData.data;
        },
      });
      return unsubscribe;
    }
  }, [data, inspectedWorldBuilding, subscribeToMore, worldBuilding]);

  const onInventoryDropItem = (item: InventoryItemType, slot: number, inventoryId: number) => {
    const packet: ClientPacket<RequestMoveInventoryItemPacketData> = {
      data: {
        ...item,
        toInventoryId: inventoryId,
        toInventoryType: InventoryType.BUILDING,
        toInventorySlot: slot,
      },
      packet_type: PacketType.REQUEST_MOVE_INVENTORY_ITEM,
    };
    Game.network.sendPacket(packet);
  };

  const onPickupBuilding = () => {
    if (!worldBuilding) return;

    const packet: ClientPacket<RequestPickupBuildingPacketData> = {
      data: { worldBuildingId: worldBuilding.id },
      packet_type: PacketType.REQUEST_PICKUP_BUILDING,
    };
    Game.network.sendPacket(packet);

    // Close window after pickup request
    dispatch(close(WindowType.VIEW_BUILDING));
  };

  const inventorySorted = sortBy(prop('slot'))(worldBuilding?.world_building_inventory ?? []);

  // Group inventory by slot type
  const inputSlots = inventorySorted.filter((item) => item.slotType === WorldBuildingInventorySlotType.INPUT);
  const fuelSlots = inventorySorted.filter((item) => item.slotType === WorldBuildingInventorySlotType.FUEL);
  const outputSlots = inventorySorted.filter((item) => item.slotType === WorldBuildingInventorySlotType.OUTPUT);

  const renderInventorySlots = (
    slots: typeof inventorySorted,
    requirements: Array<{ item: { id: number; display_name: string; name: string }; quantity: number }> = [],
  ) => {
    return slots.map((slot, index) => {
      // If slot has an item, show regular InventoryItem
      if (slot && slot.item) {
        return (
          <InventoryItem
            inventoryItem={slot}
            fromInventoryType={InventoryType.BUILDING}
            fromInventorySlot={slot.slot}
            fromInventoryId={worldBuilding!.id}
            onClick={() => {}}
            slot={slot.slot}
            onDrop={onInventoryDropItem}
            key={slot.slot}
          />
        );
      }

      // If slot is empty and there's a requirement for this position, show ghost
      const requirement = requirements[index];
      if (requirement) {
        return (
          <InventoryItemGhost
            ghostItem={requirement.item}
            requiredQuantity={requirement.quantity}
            slot={slot.slot}
            inventoryId={worldBuilding!.id}
            onDrop={onInventoryDropItem}
            key={slot.slot}
          />
        );
      }

      // Otherwise show empty placeholder
      return (
        <InventoryItemPlaceholder
          slot={slot.slot}
          inventoryId={worldBuilding!.id}
          onDrop={onInventoryDropItem}
          key={slot.slot}
        />
      );
    });
  };

  return (
    <Window
      title="Building Viewer"
      fullWindowLoading={loading}
      width={600}
      height={400}
      defaultPosition={{ x: 40, y: 40 }}
      windowType={WindowType.VIEW_BUILDING}
    >
      <div className="flex flex-col h-full gap-4">
        {/* Info Section */}
        <div className="border-b border-gray-600 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl mb-1">{worldBuilding?.building?.name}</h2>
              <div className="flex gap-4 text-xs text-gray-400">
                <p>ID: {worldBuilding?.id}</p>
                <p>
                  Pos: {worldBuilding?.x}, {worldBuilding?.y}
                </p>
                <p>Rot: {worldBuilding?.rotation}°</p>
              </div>
            </div>
            <button
              onClick={onPickupBuilding}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-sm font-medium"
              title="Pick up this building and transfer all items to your inventory"
            >
              Pick Up Building
            </button>
          </div>
        </div>

        {/* Minecraft-style Processing Layout */}
        <div className="flex-1 flex items-center justify-center gap-6 px-4">
          {/* Input Section - Left (only show if there are input slots) */}
          {inputSlots.length > 0 && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-gray-300 font-semibold">Input</p>
              <div className="flex flex-col gap-2">
                {worldBuilding && renderInventorySlots(inputSlots, worldBuilding.building?.processing_requirements || [])}
              </div>
            </div>
          )}

          {/* Arrow + Fuel Section - Center */}
          <div className="flex flex-col items-center gap-2">
            {/* Arrow (only show if there are input slots) */}
            {inputSlots.length > 0 && <div className="text-4xl text-gray-400">→</div>}
            {/* Fuel */}
            {fuelSlots.length > 0 && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-orange-300 font-semibold">Fuel</p>
                <div className="flex flex-col gap-2">
                  {worldBuilding && renderInventorySlots(fuelSlots, worldBuilding.building?.fuel_requirements || [])}
                </div>
              </div>
            )}
          </div>

          {/* Arrow between fuel and output (when no input slots) */}
          {inputSlots.length === 0 && fuelSlots.length > 0 && <div className="text-4xl text-gray-400">→</div>}

          {/* Output Section - Right */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-gray-300 font-semibold">Output</p>
            <div className="flex flex-col gap-2">{worldBuilding && renderInventorySlots(outputSlots)}</div>
          </div>
        </div>

        <WorldBuildingConnection x={worldBuilding?.x ?? 0} y={worldBuilding?.y ?? 0} />
      </div>
    </Window>
  );
}
