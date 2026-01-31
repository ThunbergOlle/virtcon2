import item_carrot from '../../items/db/item_carrot';
import item_carrot_seed from '../../items/db/item_carrot_seed';
import { DBItemRecipe } from '../item_recipe_type';

export const carrot_seed_recipe: DBItemRecipe[] = [
  {
    id: 141,
    requiredItem: item_carrot,
    requiredQuantity: 1,
    resultingItem: item_carrot_seed,
  },
];
