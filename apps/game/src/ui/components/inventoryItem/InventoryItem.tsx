import { InventoryType, ServerInventoryItem } from '@shared';
import { DBUserInventoryItem, DBWorldBuildingInventoryItem, get_item_by_id } from '@virtcon2/static-game-data';
import { useMemo } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import Game from '../../../scenes/Game';

type InventoryItem = DBUserInventoryItem | DBWorldBuildingInventoryItem;
export interface InventoryItemType {
  inventoryItem: ServerInventoryItem;
  fromInventoryType: InventoryType;
  fromInventoryId: number;
  fromInventorySlot: number;
  quantity: number;
}

export default function InventoryItem({
  inventoryItem,
  onClick,
  fromInventoryType,
  fromInventoryId,
  fromInventorySlot,
  onDrop,
  slot,
}: {
  inventoryItem: InventoryItem;
  fromInventoryType: InventoryType;
  fromInventoryId: number;
  fromInventorySlot: number;
  onClick: (item: InventoryItem) => void;
  onDrop: (item: InventoryItemType, slot: number, inventoryId: number) => void;
  slot: number;
}) {
  const itemMetaData = useMemo(() => {
    return get_item_by_id(inventoryItem.item?.id || 0);
  }, [inventoryItem]);

  const [{ canDrop }, drop] = useDrop(
    () => ({
      accept: 'inventoryItem',
      drop: (droppedItem: InventoryItemType) =>
        (droppedItem.inventoryItem?.item?.id === inventoryItem?.item?.id && onDrop(droppedItem, slot, fromInventoryId)) || undefined,
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [slot, fromInventoryId, inventoryItem],
  );

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: 'inventoryItem',
      item: { inventoryItem, fromInventoryType: fromInventoryType, fromInventoryId, fromInventorySlot },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }),
    [inventoryItem],
  );

  const icon = useMemo(() => Game.getInstance().textures.getBase64(itemMetaData?.name || ''), [itemMetaData]);

  return (
    <div
      ref={drag}
      onClick={() => onClick(inventoryItem)}
      key={inventoryItem.slot}
      className={`flex flex-col text-center w-16 h-16 bg-[#282828] cursor-pointer hover:bg-[#4b4b4b] ${isDragging && 'cursor-grabbing'}`}
    >
      <div ref={drop} className="flex flex-col my-auto">
        <img alt={itemMetaData?.display_name} className="flex-1 pixelart w-8  m-auto" src={icon}></img>
        <p className="flex-1">x{inventoryItem.quantity}</p>
        <p>{canDrop}</p>
      </div>
    </div>
  );
}

export function InventoryItemPlaceholder({
  onDrop,
  slot,
  inventoryId,
}: {
  onDrop: (item: InventoryItemType, slot: number, inventoryId: number) => void;
  slot: number;
  inventoryId: number;
}) {
  const [{ canDrop, isOver }, drop] = useDrop(
    () => ({
      accept: 'inventoryItem',
      drop: (item: InventoryItemType) => onDrop(item, slot, inventoryId),
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [slot, inventoryId],
  );
  return (
    <div
      ref={drop}
      className={`flex flex-col  text-center w-16 h-16 bg-[#282828] cursor-pointerborder-[#282828] hover:border-[#4b4b4b] hover:bg-[#4b4b4b] ${
        canDrop && isOver && '!  bg-green-200'
      } `}
    >
      <p>{slot}</p>
    </div>
  );
}
