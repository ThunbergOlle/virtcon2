import { ResourceNames, Resources } from '../../resources/resources_type';
import { DBItem, DBItemName, DBItemRarity } from '../item_type';

const item_coal: DBItem = {
  id: 8,
  name: DBItemName.COAL,
  display_name: 'Coal',
  description: 'Coal is a fuel.',
  icon: 'coal.png',
  rarity: DBItemRarity.common,
  stack_size: 256,
  is_building: false,
  resource: Resources[ResourceNames.COAL],
};
export default item_coal;
