import { item_pipe } from '../../items/db/item_pipe';
import item_wood from '../../items/db/item_wood';
import { DBItemRecipe } from '../item_recipe_type';

export const item_pipe_recipe: DBItemRecipe[] = [
  {
    id: 40,
    requiredItem: item_wood,
    requiredQuantity: 10,
    resultingItem: item_pipe,
  },
];
