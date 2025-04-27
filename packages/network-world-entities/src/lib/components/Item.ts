import { addComponent, addEntity, defineComponent, Types, World } from '@virtcon2/bytenetc';
import { get_item_by_id } from '@virtcon2/static-game-data';
import { AllTextureMaps } from '../SpriteMap';
import { GameObjectGroups } from '../utils/gameObject';
import { Collider } from './Collider';
import { Position } from './Position';
import { Sprite } from './Sprite';

export const Item = defineComponent('item', {
  itemId: Types.ui32,
  droppedFromX: Types.f32,
  droppedFromY: Types.f32,
});

interface CreateItem {
  world: World;
  itemId: number;
  x: number;
  y: number;
  droppedFromX?: number;
  droppedFromY?: number;
}

export const itemEntityComponents = [Item, Position, Sprite, Collider];
export const createItem = ({ world, itemId, x, y, droppedFromX, droppedFromY }: CreateItem) => {
  const eid = addEntity(world);
  const item = get_item_by_id(itemId);
  if (!item) {
    throw new Error(`Item with id ${itemId} not found`);
  }

  addComponent(world, Item, eid);
  Item.itemId[eid] = itemId;
  if (droppedFromX && droppedFromY) {
    Item.droppedFromX[eid] = droppedFromX;
    Item.droppedFromY[eid] = droppedFromY;
  }

  addComponent(world, Position, eid);
  Position.x[eid] = x;
  Position.y[eid] = y;

  addComponent(world, Sprite, eid);
  Sprite.texture[eid] = AllTextureMaps[item.name]?.textureId ?? 0;
  Sprite.variant[eid] = itemId % (AllTextureMaps[item.name]?.variants.length ?? 0);
  Sprite.width[eid] = 8;
  Sprite.height[eid] = 8;
  Sprite.dynamicBody[eid] = 1;

  addComponent(world, Collider, eid);
  Collider.group[eid] = GameObjectGroups.ITEM;
  Collider.static[eid] = 1;
  Collider.sizeWidth[eid] = 8;
  Collider.sizeHeight[eid] = 8;

  return eid;
};
