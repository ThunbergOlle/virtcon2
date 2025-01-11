import item_wood from '../../items/db/item_wood';
import { wood_axe } from '../../items/db/item_wood_axe';
import { DBItemRecipe } from '../item_recipe_type';

export const wood_axe_recipe: DBItemRecipe[] = [
  {
    id: 101,
    requiredItem: item_wood,
    requiredQuantity: 10,
    resultingItem: wood_axe,
  },
];
