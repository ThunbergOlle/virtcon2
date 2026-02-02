import { item_conveyor } from '../../items/db/item_conveyor';
import item_stone from '../../items/db/item_stone';
import item_iron_ore from '../../items/db/item_iron';
import { DBItemRecipe } from '../item_recipe_type';

export const item_conveyor_recipe: DBItemRecipe[] = [
  {
    id: 50,
    requiredItem: item_stone,
    requiredQuantity: 2,
    resultingItem: item_conveyor,
  },
  {
    id: 51,
    requiredItem: item_iron_ore,
    requiredQuantity: 1,
    resultingItem: item_conveyor,
  },
];
