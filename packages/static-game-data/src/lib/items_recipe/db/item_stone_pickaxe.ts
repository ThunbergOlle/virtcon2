import item_stone from '../../items/db/item_stone';
import { stone_pickaxe } from '../../items/db/item_stone_pickaxe';
import { wood_pickaxe } from '../../items/db/item_wood_pickaxe';
import { DBItemRecipe } from '../item_recipe_type';

export const stone_pickaxe_recipe: DBItemRecipe[] = [
  {
    id: 121,
    requiredItem: item_stone,
    requiredQuantity: 20,
    resultingItem: stone_pickaxe,
  },
  {
    id: 122,
    requiredItem: wood_pickaxe,
    requiredQuantity: 1,
    resultingItem: stone_pickaxe,
  },
];
