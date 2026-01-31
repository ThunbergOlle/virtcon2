import item_carrot from '../../items/db/item_carrot';
import item_sapling from '../../items/db/item_sapling';
import { DBItemRecipe } from '../item_recipe_type';

export const carrot_seed_recipe: DBItemRecipe[] = [
  {
    id: 131,
    requiredItem: item_carrot,
    requiredQuantity: 1,
    resultingItem: item_sapling,
  },
];
