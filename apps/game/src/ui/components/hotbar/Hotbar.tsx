import { gql, useFragment, useQuery } from '@apollo/client';
import { DBItem, DBUserInventoryItem } from '@virtcon2/static-game-data';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { useUser } from '../../context/user/UserContext';
import { currentItem, hotbarItems, hotbarSlice, select } from './HotbarSlice';
import { useHotkey } from './useHotkey';

const HOTBAR_ITEM_FRAGMENT = gql`
  fragment HotbarItemFragment on UserInventoryItem {
    id
    slot
    item {
      id
      name
    }
  }
`;

const HotbarItem = ({ inventoryItem }: { inventoryItem: DBUserInventoryItem }) => {
  const dispatch = useAppDispatch();
  const current = useAppSelector(currentItem);

  useEffect(() => {
    if (inventoryItem.item?.id) {
      dispatch(hotbarSlice.actions.set({ item: inventoryItem.item as DBItem, slot: inventoryItem.slot }));
    }
  }, [inventoryItem.item?.id]);

  const slot = inventoryItem.slot;
  useHotkey(slot + 1 + '', () => dispatch(select({ slot })));

  if (!inventoryItem?.item) {
    return (
      <div onClick={() => dispatch(select({ slot }))}>
        <div
          className={`pixelart h-10 w-10 mx-3 rounded-full bg-black cursor-pointer ${
            current?.id === null && 'border-green-600 border-b-4'
          }`}
        />
      </div>
    );
  }

  const item = inventoryItem.item as DBItem;

  return (
    <div onClick={() => dispatch(select({ slot }))}>
      <img
        src={`/assets/sprites/items/${item.name}.png`}
        alt="wrench"
        className={`pixelart h-10 w-10 mx-3 cursor-pointer ${item.id && current?.id === item.id && 'border-green-600 border-b-4'}`}
        draggable="false"
        unselectable="on"
      />
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
      <div className="m-auto bg-gray-800 h-full rounded-lg flex flex-row items-center ">
        {data?.userInventory.map((inventoryItem: DBUserInventoryItem) => (
          <HotbarItem key={inventoryItem.slot} inventoryItem={inventoryItem} />
        ))}
      </div>
    </div>
  );
};
