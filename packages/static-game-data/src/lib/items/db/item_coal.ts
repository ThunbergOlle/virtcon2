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
  spawnSettings: {
    minHeight: 0.2,
    maxHeight: 0.35,
    chance: 0.1,
  },
};
export default item_coal;
