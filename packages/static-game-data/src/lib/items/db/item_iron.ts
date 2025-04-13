import { DBItem, DBItemName, DBItemRarity } from '../item_type';

const item_iron_ore: DBItem = {
  id: 9,
  name: DBItemName.IRON_ORE,
  display_name: 'Iron ore',
  description: 'Needs to be melted to be useful',
  icon: 'iron.png',
  rarity: DBItemRarity.common,
  stack_size: 256,
  spawnSettings: {
    minHeight: 0.3,
    maxHeight: 0.5,
    chance: 0.1,
  },
  is_building: false,
};
export default item_iron_ore;
