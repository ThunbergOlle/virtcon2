import item_conveyor from '../../items/db/item_conveyor';
import item_stone from '../../items/db/item_stone';
import item_wood from '../../items/db/item_wood';
import { DBItemRecipe } from '../item_recipe_type';

export const item_conveyor_recipe: DBItemRecipe[] = [
  {
    id: 70,
    requiredItem: item_stone,
    requiredQuantity: 10,
    resultingItem: item_conveyor,
  },
  {
    id: 71,
    requiredItem: item_wood,
    requiredQuantity: 10,
    resultingItem: item_conveyor,
  },
];
