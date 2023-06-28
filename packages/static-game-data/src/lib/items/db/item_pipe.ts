import { DBItem, DBItemName, DBItemRarity } from '../item_type';

const item_pipe: DBItem = {
  id: 4,
  name: DBItemName.BUILDING_PIPE,
  display_name: 'Pipe',
  description: 'Use pipes to connect machines together.',
  icon: 'pipe.png',
  rarity: DBItemRarity.common,
  stack_size: 64,
  is_building: true,
};
export default item_pipe;
