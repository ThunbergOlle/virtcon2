import item_sapling from '../../items/db/item_sapling';
import item_wood from '../../items/db/item_wood';
import { DBItemRecipe } from '../item_recipe_type';

export const item_sapling_recipe: DBItemRecipe[] = [
  {
    id: 131,
    requiredItem: item_wood,
    requiredQuantity: 5,
    resultingItem: item_sapling,
  },
];
