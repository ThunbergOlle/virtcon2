import { Harvestable, HarvestableNames } from '../../harvestable_type';
import { DBItem, DBItemName, DBItemRarity } from '../item_type';

const item_carrot_seed: DBItem = {
  id: 14,
  name: DBItemName.CARROT_SEED,
  display_name: 'Carrot Seed',
  description: 'A carrot seed that can be planted to grow carrots.',
  icon: 'carrot_seed.png',
  stack_size: 99,
  rarity: DBItemRarity.common,
  is_building: false,
  harvestable: Harvestable[HarvestableNames.CARROT],
};

export default item_carrot_seed;
