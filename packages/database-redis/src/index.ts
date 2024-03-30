import World from './lib/service/world/world_service';
import Player from './lib/service/player/PlayerService';
import Building from './lib/service/building/BuildingService';

const Redis = {
  ...Player,
  ...World,
  ...Building,
};
export default Redis;
