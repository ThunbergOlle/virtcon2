import { InventoryType, ServerInventoryItem } from '@shared';
import { get_item_by_id } from '@virtcon2/static-game-data';
import { useMemo } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import Game from '../../../scenes/Game';

export interface InventoryItemType {
  item: ServerInventoryItem;
  fromInventoryType: InventoryType;
  fromInventoryId: number;
  fromInventorySlot: number;
  quantity: number;
}

export default function InventoryItem({
  item,
  onClick,
  fromInventoryType,
  fromInventoryId,
  fromInventorySlot,
  onDrop,
  slot,
}: {
  item: ServerInventoryItem;
  fromInventoryType: InventoryType;
  fromInventoryId: number;
  fromInventorySlot: number;
  onClick: (item: ServerInventoryItem) => void;
  onDrop: (item: InventoryItemType, slot: number, inventoryId: number) => void;
  slot: number;
}) {
  const itemMetaData = useMemo(() => {
    return get_item_by_id(item.item?.id || 0);
  }, [item]);
  const [{ canDrop }, drop] = useDrop(
    () => ({
      accept: 'inventoryItem',
      drop: (droppedItem: InventoryItemType) => (droppedItem.item?.item?.id === item?.item?.id && onDrop(droppedItem, slot, fromInventoryId)) || undefined,
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [slot, fromInventoryId, item],
  );

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: 'inventoryItem',
      item: { item, fromInventoryType: fromInventoryType, fromInventoryId, fromInventorySlot },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }),
    [item],
  );

  const icon = useMemo(() => Game.getInstance().textures.getBase64(itemMetaData?.name || ''), [itemMetaData]);

  return (
    <div
      ref={drag}
      onClick={() => onClick(item)}
      key={item.slot}
      className={`flex flex-col m-2 text-center w-16 h-16 bg-[#282828] cursor-pointer border-2 border-[#282828] hover:border-[#4b4b4b] hover:bg-[#4b4b4b] ${
        isDragging && 'cursor-grabbing'
      }`}
    >
      <div ref={drop}>
        <img alt={itemMetaData?.display_name} className="flex-1 pixelart w-12  m-auto" src={icon}></img>
        <p className="flex-1 m-[-8px]">x{item.quantity}</p>
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
      className={`flex flex-col m-2 text-center w-16 h-16 bg-[#282828] cursor-pointer border-2 border-[#282828] hover:border-[#4b4b4b] hover:bg-[#4b4b4b] ${
        canDrop && isOver && '!  bg-green-200'
      } `}
    >
      <p>{slot}</p>
    </div>
  );
}
