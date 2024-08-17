import { item_drill } from '../../items/db/item_drill';
import item_iron from '../../items/db/item_iron';
import item_stone from '../../items/db/item_stone';
import { DBItemRecipe } from '../item_recipe_type';

export const item_drill_recipe: DBItemRecipe[] = [
  {
    id: 40,
    requiredItem: item_iron,
    requiredQuantity: 10,
    resultingItem: item_drill,
  },
  {
    id: 41,
    requiredItem: item_stone,
    requiredQuantity: 10,
    resultingItem: item_drill,
  },
];
