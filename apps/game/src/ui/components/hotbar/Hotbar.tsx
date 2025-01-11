import { DBItem } from '@virtcon2/static-game-data';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { currentItem, hotbarItems, select } from './HotbarSlice';
import { useHotkey } from './useHotkey';

export const Hotbar = () => {
  const items = useAppSelector(hotbarItems);

  return (
    <div className="absolute h-16  z-[2] bottom-4 w-full flex">
      <div className="m-auto bg-gray-800 h-full rounded-lg flex flex-row items-center ">
        {items.map((item, index) => (
          <HotbarItem item={item} slot={index} />
        ))}
      </div>
    </div>
  );
};

const HotbarItem = ({ item, slot }: { item: DBItem | null; slot: number }) => {
  const dispatch = useAppDispatch();
  const current = useAppSelector(currentItem);

  useHotkey(slot + 1 + '', () => dispatch(select({ slot })));

  if (!item) {
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
