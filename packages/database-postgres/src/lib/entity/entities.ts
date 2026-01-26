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
import { WorldHarvestable } from './world_harvestable/WorldHarvestable';
import { WorldPlot } from './world_plot/WorldPlot';
import { WorldResource } from './world_resource/WorldResource';

export default [
  User,
  RequestLog,
  World,
  Item,
  UserInventoryItem,
  WorldBuilding,
  Building,
  ItemRecipe,
  WorldBuildingInventory,
  BuildingProcessingRequirement,
  WorldConnectionPoint,
  WorldPlot,
  WorldResource,
  WorldHarvestable,
];
