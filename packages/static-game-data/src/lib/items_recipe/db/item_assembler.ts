import { item_assembler } from '../../items/db/item_assembler';
import item_iron_ore from '../../items/db/item_iron';
import item_stone from '../../items/db/item_stone';
import { DBItemRecipe } from '../item_recipe_type';

export const item_assembler_recipe: DBItemRecipe[] = [
  {
    id: 142,
    requiredItem: item_iron_ore,
    requiredQuantity: 50,
    resultingItem: item_assembler,
  },
  {
    id: 143,
    requiredItem: item_stone,
    requiredQuantity: 50,
    resultingItem: item_assembler,
  },
];
