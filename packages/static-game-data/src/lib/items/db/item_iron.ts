import { ResourceNames, Resources } from '../../resources/resources_type';
import { DBItem, DBItemName, DBItemRarity } from '../item_type';

const item_iron_ore: DBItem = {
  id: 9,
  name: DBItemName.IRON_ORE,
  display_name: 'Iron ore',
  description: 'Needs to be melted to be useful',
  icon: 'iron.png',
  rarity: DBItemRarity.common,
  stack_size: 256,
  resource: Resources[ResourceNames.IRON],
  is_building: false,
};
export default item_iron_ore;
