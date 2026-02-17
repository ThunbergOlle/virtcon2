import { item_crate } from '../../items/db/item_crate';
import item_wood from '../../items/db/item_wood';
import { DBItemRecipe } from '../item_recipe_type';

export const item_crate_recipe: DBItemRecipe[] = [
  {
    id: 60,
    requiredItem: item_wood,
    requiredQuantity: 8,
    resultingItem: item_crate,
  },
];
