import { gql, useFragment } from '@apollo/client';
import Game from '../../../scenes/Game';
import { UserInventoryItem } from '@virtcon2/database-postgres';
import { useMemo } from 'react';

export const CRAFTER_RECIPE_ITEM_FRAGMENT = gql`
  fragment CrafterRecipeItemFragment on Item {
    recipe {
      id
      requiredItem {
        id
        display_name
        name
      }
      requiredQuantity
    }
  }
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
    from: {
      __typename: 'ItemRecipe',
      id: itemRecipeId,
    },
  });

  const inventoryQuantity = useMemo(() => {
    if (!data?.requiredItem.id) return 0;

    return inventoryItems.find((i) => i.item?.id === data?.requiredItem.id)?.quantity || 0;
  }, [inventoryItems, data]);

  if (!data?.id) return null;

  return (
    <div
      key={`recipe-${data.requiredItem.id}`}
      className="flex flex-col text-center w-20 h-20  cursor-pointer border-2 border-[#282828] hover:border-[#4b4b4b] hover:bg-[#4b4b4b]"
    >
      <img alt={data.requiredItem.display_name} className="flex-1 pixelart w-12  m-auto" src={`/assets/sprites/items/${data.requiredItem.name}.png`}></img>
      <p className="flex-1 m-[-8px]">
        {inventoryQuantity || 0}/{data.requiredQuantity}
      </p>
      <p className="flex-1 text-[11px]">{data.requiredItem.display_name}</p>
    </div>
  );
};
