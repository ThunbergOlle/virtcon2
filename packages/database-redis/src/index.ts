import World from './lib/service/world/world_service';
import Player from './lib/service/player/PlayerService';

const Redis = {
  ...Player,
  ...World,
};
export default Redis;
