import { item_sawmill } from '../../items/db/item_sawmill';
import item_stick from '../../items/db/item_stick';
import item_wood from '../../items/db/item_wood';
import { DBItemRecipe } from '../item_recipe_type';

export const item_sawmill_recipe: DBItemRecipe[] = [
  {
    id: 30,
    requiredItem: item_wood,
    requiredQuantity: 10,
    resultingItem: item_sawmill,
  },
  {
    id: 31,
    requiredItem: item_stick,
    requiredQuantity: 10,
    resultingItem: item_sawmill,
  },
];
