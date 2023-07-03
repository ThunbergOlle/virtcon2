import { DBItem, DBItemName, DBItemRarity } from '../item_type';

const item_stone: DBItem = {
  id: 6,
  name: DBItemName.STONE,
  display_name: 'Stone',
  stack_size: 256,
  description: 'A stone.',
  icon: 'stone.png',
  rarity: DBItemRarity.common,
  spawnSettings: {
    minHeight: 0.15,
    maxHeight: 0.3,
    chance: 0.15,
  },
  is_building: false,
};
export default item_stone;
