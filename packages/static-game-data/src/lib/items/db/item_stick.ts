import { DBItem, DBItemName, DBItemRarity } from '../item_type';

const item_stick: DBItem = {
  id: 2,
  name: DBItemName.STICK,
  display_name: 'Stick',
  description: 'Stick is a natural resource that can be used to craft items.',
  icon: 'stick.png',
  rarity: DBItemRarity.common,
  is_building: false,
};
export default item_stick;
