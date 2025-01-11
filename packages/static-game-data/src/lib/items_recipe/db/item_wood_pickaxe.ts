import item_stick from '../../items/db/item_stick';
import item_wood from '../../items/db/item_wood';
import { wood_pickaxe } from '../../items/db/item_wood_pickaxe';
import { DBItemRecipe } from '../item_recipe_type';

export const wood_pickaxe_recipe: DBItemRecipe[] = [
  {
    id: 111,
    requiredItem: item_wood,
    requiredQuantity: 10,
    resultingItem: wood_pickaxe,
  },
  {
    id: 112,
    requiredItem: item_stick,
    requiredQuantity: 5,
    resultingItem: wood_pickaxe,
  },
];
