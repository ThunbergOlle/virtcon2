import { HarvestableNames } from '../harvestable_type';
import { ResourceNames } from '../resources/resources_type';
import { DBItemName } from './item_type';

export interface ToolType {
  item: DBItemName;
  damage: number;
  targets: ResourceNames[];
  harvestableTargets?: HarvestableNames[];
}
