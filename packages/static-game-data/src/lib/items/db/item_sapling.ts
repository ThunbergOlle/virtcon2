import { DBItem, DBItemName, DBItemRarity } from '../item_type';

const item_sapling: DBItem = {
  id: 13,
  name: DBItemName.SAPLING,
  display_name: 'Sapling',
  description: 'A small tree seedling that can be planted.',
  icon: 'sapling.png',
  stack_size: 64,
  rarity: DBItemRarity.common,
  is_building: false,
};

export default item_sapling;
