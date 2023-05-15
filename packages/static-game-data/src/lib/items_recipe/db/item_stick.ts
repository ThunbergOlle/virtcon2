import item_stick from '../../items/db/item_stick';
import item_wood from '../../items/db/item_wood';
import { DBItemRecipe } from '../item_recipe_type';

export const item_stick_recipe: DBItemRecipe[] = [
  {
    id: 1,
    requiredItem: item_wood,
    requiredQuantity: 1,
    resultingItem: item_stick,
  },
];
