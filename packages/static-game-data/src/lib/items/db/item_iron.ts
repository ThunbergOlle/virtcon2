import { DBItem, DBItemName, DBItemRarity } from '../item_type';

const item_iron: DBItem = {
  id: 9,
  name: DBItemName.IRON,
  display_name: 'Iron',
  description: 'Iron can be used to craft hard things.',
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
export default item_iron;
