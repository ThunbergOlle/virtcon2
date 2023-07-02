import { DBItem, DBItemName, DBItemRarity } from '../item_type';

const item_drill: DBItem = {
  id: 5,
  name: DBItemName.BUILDING_DRILL,
  display_name: 'Drill',
  description: 'A drill that mines materials.',
  icon: 'drill.png',
  rarity: DBItemRarity.common,
  stack_size: 64,
  is_building: true,
};
export default item_drill;
