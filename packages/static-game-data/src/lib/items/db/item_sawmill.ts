import { DBItem, DBItemName, DBItemRarity } from '../item_type';

const item_sawmill: DBItem = {
  id: 3,
  name: DBItemName.BUILDING_SAWMILL,
  display_name: 'Sawmill',
  description: 'Sawmill can extract wood from trees.',
  icon: 'sawmill.png',
  rarity: DBItemRarity.common,
  is_building: true,
};
export default item_sawmill;
