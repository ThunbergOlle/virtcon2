import { ResourceNames, Resources } from '../../resources/resources_type';
import { DBItem, DBItemName, DBItemRarity } from '../item_type';

const item_stone: DBItem = {
  id: 6,
  name: DBItemName.STONE,
  display_name: 'Stone',
  stack_size: 256,
  description: 'A stone.',
  icon: 'stone.png',
  rarity: DBItemRarity.common,
  resource: Resources[ResourceNames.STONE],
  is_building: false,
};
export default item_stone;
