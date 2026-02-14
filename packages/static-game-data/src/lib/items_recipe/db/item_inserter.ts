import { item_inserter } from '../../items/db/item_inserter';
import item_iron_ore from '../../items/db/item_iron';
import item_stone from '../../items/db/item_stone';
import { DBItemRecipe } from '../item_recipe_type';

export const item_inserter_recipe: DBItemRecipe[] = [
  {
    id: 52,
    requiredItem: item_stone,
    requiredQuantity: 2,
    resultingItem: item_inserter,
  },
  {
    id: 53,
    requiredItem: item_iron_ore,
    requiredQuantity: 2,
    resultingItem: item_inserter,
  },
];
