import { ResourceNames } from '../../resources/resources_type';
import { DBItem, DBItemName, DBItemRarity } from '../item_type';
import { ToolType } from '../tool_type';

const ID = 12;

export const stone_pickaxe: DBItem = {
  id: ID,
  name: DBItemName.STONE_PICKAXE,
  display_name: 'Stone pickaxe',
  description: 'Can mine iron',
  icon: 'stone_pickaxe.png',
  rarity: DBItemRarity.common,
  stack_size: 1,
  is_building: false,
};

export const stone_pickaxe_tool: ToolType = {
  item: DBItemName.STONE_PICKAXE,
  damage: 2,
  targets: [ResourceNames.STONE, ResourceNames.COAL, ResourceNames.IRON],
};
