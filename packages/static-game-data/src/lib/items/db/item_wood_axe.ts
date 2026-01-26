import { HarvestableNames } from '../../harvestable_type';
import { ResourceNames } from '../../resources/resources_type';
import { DBItem, DBItemName, DBItemRarity } from '../item_type';
import { ToolType } from '../tool_type';

const ID = 10;

export const wood_axe: DBItem = {
  id: ID,
  name: DBItemName.WOOD_AXE,
  display_name: 'Wooden axe',
  description: 'Can chop down trees',
  icon: 'wood_axe.png',
  rarity: DBItemRarity.common,
  stack_size: 1,
  is_building: false,
};

export const wood_axe_tool: ToolType = {
  item: DBItemName.WOOD_AXE,
  damage: 1,
  targets: [ResourceNames.WOOD],
  harvestableTargets: [HarvestableNames.WOOD],
};
