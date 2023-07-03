import { DBItem, DBItemName, DBItemRarity } from '../item_type';

const item_conveyor: DBItem = {
  id: 7,
  name: DBItemName.BUILDING_CONVEYOR,
  display_name: 'Conveyor Belt',
  description: 'Conveyor Belt can transport items.',
  icon: 'conveyor.png',
  rarity: DBItemRarity.common,
  stack_size: 64,
  is_building: true,
};
export default item_conveyor;
