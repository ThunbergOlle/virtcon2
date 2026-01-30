import { Harvestable } from '../../harvestable_type';
import { DBItem, DBItemName, DBItemRarity } from '../item_type';

const item_carrot: DBItem = {
  id: 15,
  name: DBItemName.CARROT,
  display_name: 'Carrot',
  description: 'A fresh carrot harvested from the ground.',
  icon: 'carrot.png',
  stack_size: 99,
  rarity: DBItemRarity.common,
  is_building: false,
  harvestable: Harvestable.harvestable_carrot,
};

export default item_carrot;
