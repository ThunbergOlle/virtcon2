import World from './lib/service/world/world_service';
import Player from './lib/service/player/PlayerService';
import WorldBuilding from './lib/service/building/WorldBuildingService';

const Redis = {
  ...Player,
  ...World,
  ...WorldBuilding,
};
export default Redis;
