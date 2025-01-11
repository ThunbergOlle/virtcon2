import { ResourceNames } from '../../resources/resources_type';
import { DBItem, DBItemName, DBItemRarity } from '../item_type';
import { ToolType } from '../tool_type';

const ID = 11;

export const wood_pickaxe: DBItem = {
  id: ID,
  name: DBItemName.WOOD_PICKAXE,
  display_name: 'Wooden pickaxe',
  description: 'Can mine stones',
  icon: 'wood_pickaxe.png',
  rarity: DBItemRarity.common,
  stack_size: 1,
  is_building: false,
};

export const wood_pickaxe_tool: ToolType = {
  item: DBItemName.WOOD_PICKAXE,
  damage: 1,
  targets: [ResourceNames.STONE, ResourceNames.COAL],
};
