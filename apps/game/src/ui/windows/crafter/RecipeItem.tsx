import { gql, useFragment } from '@apollo/client';
import Game from '../../../scenes/Game';
import { UserInventoryItem } from '@virtcon2/database-postgres';
import { useMemo } from 'react';

export const CRAFTER_RECIPE_ITEM_FRAGMENT = gql`
  fragment CrafterRecipeItemFragment on ItemRecipe {
    id
    requiredItem {
      id
      display_name
      name
    }
    requiredQuantity
  }
`;

export const CRAFTER_RECIPE_INVENTORY_FRAGMENT = gql`
  fragment CrafterRecipeInventoryFragment on UserInventoryItem {
    item {
      id
    }
    quantity
  }
`;

export const CrafterRecipeItem = ({ itemRecipeId, inventoryItems }: { itemRecipeId: number; inventoryItems: UserInventoryItem[] }) => {
  const { data } = useFragment({
    fragment: CRAFTER_RECIPE_ITEM_FRAGMENT,
    fragmentName: 'CrafterRecipeItemFragment',
    from: {
      __typename: 'ItemRecipe',
      id: itemRecipeId,
    },
  });

  const inventoryQuantity = useMemo(() => {
    if (!data?.requiredItem?.id) return 0;

    return inventoryItems.reduce((acc, i) => {
      if (i.item?.id === data.requiredItem.id) {
        return acc + i.quantity;
      }
      return acc;
    }, 0);
  }, [inventoryItems, data]);

  const icon = useMemo(() => Game.getInstance().textures.getBase64((data.requiredItem?.name || '') + '_0'), [data.requiredItem]);

  if (!data?.id) return null;

  return (
    <div
      key={`recipe-${itemRecipeId}-${data.requiredItem.id}`}
      className="flex flex-col text-center w-20 h-20  cursor-pointer border-2 border-[#282828] hover:border-[#4b4b4b] hover:bg-[#4b4b4b]"
    >
      <img alt={data.requiredItem.display_name} className="flex-1 pixelart w-12  m-auto" src={icon} />
      <p className="flex-1 m-[-8px]">
        {inventoryQuantity || 0}/{data.requiredQuantity}
      </p>
      <p className="flex-1 text-[11px]">{data.requiredItem.display_name}</p>
    </div>
  );
};
