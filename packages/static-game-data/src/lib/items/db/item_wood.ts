import { DBItem, DBItemName, DBItemRarity } from '../item_type';

const item_wood: DBItem = {
  id: 1,
  name: DBItemName.WOOD,
  display_name: 'Wood',
  description: 'Wood is a natural resource that can be used to craft items.',
  icon: 'wood.png',
  rarity: DBItemRarity.common,
  spawnSettings: {
    minHeight: 0,
    maxHeight: 0.2,
    chance: 0.4,
  },
  is_building: false,
};
export default item_wood;
