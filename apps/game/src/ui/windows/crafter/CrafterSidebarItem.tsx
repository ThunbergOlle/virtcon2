import { gql, useFragment } from '@apollo/client';
import Game from '../../../scenes/Game';

export const CRAFTER_SIDE_BAR_ITEM_FRAGMENT = gql`
  fragment CrafterSideBarItemFragment on Item {
    id
    display_name
    name
  }
`;

export const CrafterSideBarItem = ({ itemId, selectItem }: { itemId: number; selectItem: (itemId: number) => void }) => {
  const { data } = useFragment({
    fragment: CRAFTER_SIDE_BAR_ITEM_FRAGMENT,
    from: {
      __typename: 'Item',
      id: itemId,
    },
  });

  if (!data) {
    return null;
  }

  const icon = Game.getInstance().textures.getBase64(data?.name || '');

  return (
    <div
      onClick={() => {
        selectItem(itemId);
      }}
      key={itemId}
      className="flex flex-row px-2  items-center  w-full h-10 bg-[#282828] cursor-pointer border-2 border-[#282828] hover:border-[#4b4b4b] hover:bg-[#4b4b4b]"
    >
      <p className="flex-1">{data.display_name}</p>
      <div className="flex-1">
        <img alt={data.display_name} className="pixelart h-10 w-10 float-right" src={icon}></img>
      </div>
    </div>
  );
};
