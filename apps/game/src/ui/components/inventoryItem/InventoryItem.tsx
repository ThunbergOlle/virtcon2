import { InventoryType, ServerInventoryItem } from '@shared';
import { get_item_by_id } from '@virtcon2/static-game-data';
import { useMemo } from 'react';
import { useDrag, useDrop } from 'react-dnd';

export interface InventoryItemType {
  item: ServerInventoryItem;
  fromInventoryType: InventoryType;
  fromInventoryId: number;
  quantity: number;
}

export default function InventoryItem({
  item,
  onClick,
  fromInventoryType,
  fromInventoryId,
}: {
  item: ServerInventoryItem;
  fromInventoryType: InventoryType;
  fromInventoryId: number;
  onClick: (item: ServerInventoryItem) => void;
}) {
  const itemMetaData = useMemo(() => {
    return get_item_by_id(item.item.id);
  }, [item]);
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'inventoryItem',
    item: { item, fromInventoryType: fromInventoryType, fromInventoryId },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [item]);
  return (
    <div
      ref={drag}
      onClick={() => onClick(item)}
      key={item.id}
      className={`flex flex-col m-2 text-center w-16 h-16 bg-[#282828] cursor-pointer border-2 border-[#282828] hover:border-[#4b4b4b] hover:bg-[#4b4b4b] ${isDragging && 'cursor-grabbing'}`}
    >
      <img alt={itemMetaData?.display_name} className="flex-1 pixelart w-12  m-auto" src={`/assets/sprites/items/${itemMetaData?.name}.png`}></img>
      <p className="flex-1 m-[-8px]">x{item.quantity}</p>
    </div>
  );
}

export function InventoryItemPlaceholder({ onDrop }: { onDrop: (item: InventoryItemType) => void }) {
  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: 'inventoryItem',
    drop: onDrop,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));
  return (
    <div
      ref={drop}
      className={`flex flex-col m-2 text-center w-16 h-16 bg-[#282828] cursor-pointer border-2 border-[#282828] hover:border-[#4b4b4b] hover:bg-[#4b4b4b] ${canDrop && isOver && '!  bg-green-200'} `}
    ></div>
  );
}