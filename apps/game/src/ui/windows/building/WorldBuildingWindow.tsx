import { gql, useQuery } from '@apollo/client';
import { ClientPacket, InventoryType, PacketType, RequestMoveInventoryItemPacketData, RequestPickupBuildingPacketData, RequestSetAssemblerOutputPacketData } from '@virtcon2/network-packet';
import { all_db_items, all_db_items_recipes, DBItemName, DBWorldBuilding, WorldBuildingInventorySlotType } from '@virtcon2/static-game-data';
import { prop, sortBy } from 'ramda';
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import Game from '../../../scenes/Game';
import InventoryItem, { InventoryItemPlaceholder, InventoryItemGhost, InventoryItemType } from '../../components/inventoryItem/InventoryItem';
import Window from '../../components/window/Window';
import { close, WindowType } from '../../lib/WindowSlice';

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
    assemblerData {
      progressTicks
      outputItem {
        id
        name
        display_name
        craftingTime
        recipe {
          id
          requiredQuantity
          requiredItem {
            id
            name
            display_name
          }
        }
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

const craftableItems = all_db_items.filter((item) => item.craftingTime && all_db_items_recipes.some((r) => r.resultingItem.id === item.id));

export default function WorldBuildingWindow() {
  const dispatch = useAppDispatch();
  const inspectedWorldBuilding = useAppSelector((state) => state.inspectedBuilding.inspectedWorldBuildingId);
  const [showItemPicker, setShowItemPicker] = useState(false);

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

  const onSetAssemblerOutput = (outputItemId: number | null) => {
    if (!worldBuilding) return;
    const packet: ClientPacket<RequestSetAssemblerOutputPacketData> = {
      data: { worldBuildingId: worldBuilding.id, outputItemId },
      packet_type: PacketType.REQUEST_SET_ASSEMBLER_OUTPUT,
    };
    Game.network.sendPacket(packet);
    setShowItemPicker(false);
  };

  const isAssembler = worldBuilding?.building?.name === DBItemName.BUILDING_ASSEMBLER;

  const inventorySorted = sortBy(prop('slot'))(worldBuilding?.world_building_inventory ?? []);

  // Group inventory by slot type
  const inputSlots = inventorySorted.filter((item) => item.slotType === WorldBuildingInventorySlotType.INPUT);
  const fuelSlots = inventorySorted.filter((item) => item.slotType === WorldBuildingInventorySlotType.FUEL);
  const outputSlots = inventorySorted.filter((item) => item.slotType === WorldBuildingInventorySlotType.OUTPUT);
  const storageSlots = inventorySorted.filter((item) => item.slotType === WorldBuildingInventorySlotType.INPUT_AND_OUTPUT);

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
      height={450}
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
              <div className="grid grid-cols-2 gap-2">
                {worldBuilding &&
                  renderInventorySlots(
                    inputSlots,
                    isAssembler
                      ? (worldBuilding.assemblerData?.outputItem?.recipe?.map((r) => ({ item: r.requiredItem, quantity: r.requiredQuantity })) ?? [])
                      : (worldBuilding.building?.processing_requirements ?? []),
                  )}
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
          {outputSlots.length > 0 && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-gray-300 font-semibold">Output</p>
              <div className="flex flex-col gap-2">{worldBuilding && renderInventorySlots(outputSlots)}</div>
            </div>
          )}

          {/* Storage Section - for INPUT_AND_OUTPUT slots */}
          {storageSlots.length > 0 && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-gray-300 font-semibold">Inventory</p>
              <div className="grid grid-cols-3 gap-2">{worldBuilding && renderInventorySlots(storageSlots)}</div>
            </div>
          )}
        </div>

        {/* Assembler output configuration */}
        {isAssembler && (
          <div className="border-t border-gray-600 pt-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Producing:</span>
                {worldBuilding?.assemblerData?.outputItem ? (
                  <span className="text-sm text-white font-medium">{worldBuilding.assemblerData.outputItem.display_name}</span>
                ) : (
                  <span className="text-sm text-gray-500 italic">Not configured</span>
                )}
              </div>
              <button
                onClick={() => setShowItemPicker(!showItemPicker)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
              >
                Change Output
              </button>
            </div>
            {showItemPicker && (
              <div className="max-h-28 overflow-y-auto flex flex-wrap gap-1 p-1 bg-gray-800 rounded">
                {craftableItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSetAssemblerOutput(item.id)}
                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white transition-colors"
                  >
                    {item.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Window>
  );
}
