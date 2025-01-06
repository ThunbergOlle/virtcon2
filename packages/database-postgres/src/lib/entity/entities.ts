import { Building } from './building/Building';
import { BuildingProcessingRequirement } from './building_processing_requirement/BuildingProcessingRequirement';
import { Item } from './item/Item';
import { ItemRecipe } from './item_recipe/ItemRecipe';
import { RequestLog } from './log/RequestLog';
import { User } from './user/User';
import { UserInventoryItem } from './user_inventory_item/UserInventoryItem';
import { World } from './world/World';
import { WorldBuilding } from './world_building/WorldBuilding';
import { WorldBuildingInventory } from './world_building_inventory/WorldBuildingInventory';
import { WorldConnectionPoint } from './world_connection_point/WorldConnectionPoint';
import { WorldWhitelist } from './world_whitelist/WorldWhitelist';

export default [
  User,
  RequestLog,
  WorldWhitelist,
  World,
  Item,
  UserInventoryItem,
  WorldBuilding,
  Building,
  ItemRecipe,
  WorldBuildingInventory,
  BuildingProcessingRequirement,
  WorldConnectionPoint,
];
