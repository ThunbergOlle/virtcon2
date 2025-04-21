import { gql, useQuery } from '@apollo/client';
import { DBItem, DBUserInventoryItem } from '@virtcon2/static-game-data';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { useUser } from '../../context/user/UserContext';
import { currentSlot, hotbarSlice, select } from './HotbarSlice';
import { useHotkey } from './useHotkey';

const HOTBAR_ITEM_FRAGMENT = gql`
  fragment HotbarItemFragment on UserInventoryItem {
    id
    slot
    quantity
    item {
      id
      name
    }
  }
`;

const HotbarItem = ({ inventoryItem }: { inventoryItem: DBUserInventoryItem }) => {
  const dispatch = useAppDispatch();
  const selectedSlot = useAppSelector(currentSlot);

  useEffect(() => {
    if (inventoryItem.item?.id) {
      dispatch(hotbarSlice.actions.set({ item: inventoryItem.item as DBItem, slot: inventoryItem.slot }));
    }
  }, [inventoryItem.item?.id]);

  const slot = inventoryItem.slot;
  useHotkey(slot + 1 + '', () => dispatch(select({ slot })));

  if (!inventoryItem?.item) {
    return (
      <div
        onClick={() => dispatch(select({ slot }))}
        className={`p-1 relative hover:cursor-pointer hover:bg-gray-700 rounded-lg ${selectedSlot === slot && 'bg-green-700'}`}
      >
        <div className={`pixelart h-10 w-10 `} />
      </div>
    );
  }

  const item = inventoryItem.item as DBItem;

  return (
    <div
      onClick={() => dispatch(select({ slot }))}
      className={`p-1 relative hover:cursor-pointer hover:bg-gray-700 rounded-lg ${selectedSlot === slot && 'bg-green-700'}`}
    >
      <img
        src={`/assets/sprites/items/${item.name}.png`}
        alt="wrench"
        className={`pixelart h-10 w-10 cursor-pointer`}
        draggable="false"
        unselectable="on"
      />
      <div className="absolute top-0 left-0 w-full h-full flex items-end justify-end">
        <span className="text-xs text-white font-bold">{inventoryItem.quantity}</span>
      </div>
    </div>
  );
};

const HOTBAR_QUERY = gql`
  ${HOTBAR_ITEM_FRAGMENT}
  query HotBar($userId: ID!) {
    userInventory(userId: $userId, limit: 8) {
      id
      slot
      ...HotbarItemFragment
    }
  }
`;
export const Hotbar = () => {
  const { id: userId } = useUser();
  const { data, loading } = useQuery(HOTBAR_QUERY, {
    variables: { userId },
  });

  if (loading) return null;

  return (
    <div className="absolute h-16  z-[2] bottom-4 w-full flex">
      <div className="m-auto bg-gray-800 h-full rounded-lg flex flex-row items-center gap-2 px-2">
        {data?.userInventory.map((inventoryItem: DBUserInventoryItem) => (
          <HotbarItem key={inventoryItem.slot} inventoryItem={inventoryItem} />
        ))}
      </div>
    </div>
  );
};
