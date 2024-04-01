import Player from './lib/service/player/PlayerService';
import WorldBuilding from './lib/service/building/WorldBuildingService';

const Redis = {
  ...Player,
  ...WorldBuilding,
};
export default Redis;
