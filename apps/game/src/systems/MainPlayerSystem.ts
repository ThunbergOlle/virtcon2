import { every } from '@shared';
import {
  addComponent,
  addEntity,
  debugEntity,
  defineQuery,
  defineSystem,
  enterQuery,
  Entity,
  removeEntity,
  World,
} from '@virtcon2/bytenetc';
import {
  Collider,
  ItemTextureMap,
  MainPlayer,
  MainPlayerAction,
  MiscTextureMap,
  Player,
  Position,
  Range,
  Resource,
  Sprite,
  Velocity,
} from '@virtcon2/network-world-entities';
import { getItemByName, get_resource_by_item_name, Resources, ToolType } from '@virtcon2/static-game-data';
import { memoizeWith, pick } from 'ramda';
import { events } from '../events/Events';
import { GameObjectGroups, GameState } from '../scenes/Game';
import { store } from '../store';
import { currentItem, currentTool } from '../ui/components/hotbar/HotbarSlice';
import { damageResource } from './ResourceSystem';

const speed = 750;
const mainPlayerQuery = defineQuery(MainPlayer, Position, Sprite, Player, Collider, Range);
const mainPlayerQueryEnter = enterQuery(mainPlayerQuery);

export const createMainPlayerSystem = (world: World, scene: Phaser.Scene, cursors: Phaser.Types.Input.Keyboard.CursorKeys) => {
  const [keyW, keyA, keyS, keyD, keySpace] = [
    scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
    scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
    scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
    scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
  ];
  const minAngleLine = scene.add.line(0, 0, 0, 0, 0, 0, 0xff0000);
  const maxAngleLine = scene.add.line(0, 0, 0, 0, 0, 0, 0xff0000);

  return defineSystem<GameState>((state) => {
    const enterEntities = mainPlayerQueryEnter(world);
    for (let i = 0; i < enterEntities.length; i++) {
      const id = enterEntities[i];
      console.log(debugEntity(world, id));

      const texture = state.spritesById[id];
      if (texture && texture.body) {
        /* Follow the main character */
        scene.cameras.main.startFollow(texture);
        scene.cameras.main.setZoom(5);
      }
      /* Add event listeners */
      /* Event listener for inventory event */
      scene.input.keyboard?.on('keydown-E', () => {
        events.notify('onInventoryButtonPressed');
      });
      /* Event listener for crafter event */
      scene.input.keyboard?.on('keydown-C', () => {
        events.notify('onCrafterButtonPressed');
      });
    }
    const entities = mainPlayerQuery(world);
    for (let i = 0; i < entities.length; i++) {
      let xVel: number =
        (Number(cursors.right.isDown || scene.input.keyboard?.checkDown(keyD)) -
          Number(cursors.left.isDown || scene.input.keyboard.checkDown(keyA))) /
        10;
      let yVel: number =
        (Number(cursors.down.isDown || scene.input.keyboard?.checkDown(keyS)) -
          Number(cursors.up.isDown || scene.input.keyboard.checkDown(keyW))) /
        10;

      // Normalize speed in the diagonals
      if (yVel !== 0 && xVel !== 0) {
        yVel = yVel / 2;
        xVel = xVel / 2;
      }

      Velocity.x[entities[i]] = xVel * speed;
      Velocity.y[entities[i]] = yVel * speed;

      const sprite = state.spritesById[entities[i]];
      const { x: velX, y: velY } = sprite.body?.velocity || { x: 0, y: 0 };
      if (velX !== 0 || velY !== 0) {
        const angle = Math.atan2(velY, velX);
        const angleRange = (32 * Math.PI) / 180;
        const range = 32;
        const maxAngle = angle + angleRange;
        const minAngle = angle - angleRange;

        const maxY = range * Math.sin(maxAngle);
        const maxX = range * Math.cos(maxAngle);

        const minY = range * Math.sin(minAngle);
        const minX = range * Math.cos(minAngle);

        Range.minX[entities[i]] = sprite.x + minX;
        Range.minY[entities[i]] = sprite.y + minY;
        Range.maxX[entities[i]] = sprite.x + maxX;
        Range.maxY[entities[i]] = sprite.y + maxY;

        minAngleLine.setTo(sprite.x, sprite.y, sprite.x + minX, sprite.y + minY);
        maxAngleLine.setTo(sprite.x, sprite.y, sprite.x + maxX, sprite.y + maxY);

        minAngleLine.setAlpha(0.5);
        maxAngleLine.setAlpha(0.5);
      }

      if (scene.input.keyboard.checkDown(keySpace)) {
        attack(state, world, entities[i]);
      }
      highlightTargets(state, world, entities[i]);
    }
    return state;
  });
};

const isWithinRange = (eid: Entity, x: number, y: number) => {
  const [playerX, playerY] = [Position.x[eid], Position.y[eid]];
  const [minX, minY, maxX, maxY] = [Range.minX[eid], Range.minY[eid], Range.maxX[eid], Range.maxY[eid]];

  // Helper function to calculate the area of a triangle given three points
  const triangleArea = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) =>
    Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2);

  // Area of the main triangle formed by the player's position and the min/max points
  const totalArea = triangleArea(playerX, playerY, minX, minY, maxX, maxY);

  // Areas of sub-triangles formed with the point (x, y)
  const area1 = triangleArea(x, y, minX, minY, maxX, maxY);
  const area2 = triangleArea(playerX, playerY, x, y, maxX, maxY);
  const area3 = triangleArea(playerX, playerY, minX, minY, x, y);

  // Check if the sum of the sub-triangle areas equals the total area
  return Math.abs(totalArea - (area1 + area2 + area3)) < 1e-6; // Tolerance for floating-point arithmetic
};

const getTargetItemIds = (tool: ToolType) =>
  tool.targets
    .map((targetResourceName) => Resources[targetResourceName].item)
    .map(getItemByName)
    .filter((item) => item)
    .map((item) => item!.id);

const getTargetItemIdsMemoized = memoizeWith((tool: ToolType) => tool.item, getTargetItemIds);

const resourceQuery = defineQuery(Position, Resource);
const findResourceInRange = (world: World, playerEid: number) => {
  const resources = resourceQuery(world);
  for (let i = 0; i < resources.length; i++) {
    const resource = resources[i];
    if (isWithinRange(playerEid, Position.x[resource], Position.y[resource])) return resource;
  }
  return null;
};

const shouldUpdateHighlight = every(30);
let highlightedSprite: Phaser.GameObjects.Sprite | null = null;
const highlightTargets = (state: GameState, world: World, eid: number) => {
  if (!shouldUpdateHighlight()) return;
  const selectedTool = currentTool(store.getState());
  if (!selectedTool) {
    highlightedSprite?.resetPipeline();
    return;
  }

  const playerSprite = state.spritesById[eid];
  const [x, y] = [playerSprite.x, playerSprite.y];

  const targetItemsIds = getTargetItemIdsMemoized(selectedTool);

  const resourceId = findResourceInRange(world, eid);
  if (resourceId !== null) {
    const canDamage = targetItemsIds.includes(Resource.itemId[resourceId]);

    const sprite = state.spritesById[resourceId];
    if (highlightedSprite) highlightedSprite.resetPipeline();
    sprite.setPipeline('outline');
    highlightedSprite = sprite;

    if (canDamage) sprite.pipeline.set4f('uOutlineColor', 0, 1, 0, 1);
    else sprite.pipeline.set4f('uOutlineColor', 1, 0, 0, 1);
  } else highlightedSprite?.resetPipeline();
};

function attack(state: GameState, world: World, eid: number) {
  if (MainPlayer.action[eid] !== MainPlayerAction.IDLE) return;

  const selectedItem = currentItem(store.getState());
  if (!selectedItem) return;
  const selectedTool = currentTool(store.getState());
  if (!selectedTool) return;

  const textureId = ItemTextureMap[selectedItem.name]?.textureId;
  if (!textureId) throw new Error(`Texture not found for tool: ${selectedItem}`);

  const resourceTargetId = findResourceInRange(world, eid);
  if (resourceTargetId === null) return;

  const targetItemsIds = getTargetItemIdsMemoized(selectedTool);
  if (!targetItemsIds.includes(Resource.itemId[resourceTargetId!])) return;

  MainPlayer.action[eid] = MainPlayerAction.ATTACKING;

  const tool = addEntity(world);
  addComponent(world, Sprite, tool);

  Sprite.texture[tool] = textureId;
  Sprite.dynamicBody[tool] = 1;
  Sprite.variant[tool] = 0;

  addComponent(world, Position, tool);
  Position.x[tool] = Position.x[resourceTargetId];
  Position.y[tool] = Position.y[resourceTargetId] - 10;

  state.spritesById[resourceTargetId].setTint(0xff0000);
  setTimeout(() => state.spritesById[resourceTargetId!].clearTint(), 100);

  addComponent(world, Velocity, tool);
  Velocity.x[tool] = 0;
  Velocity.y[tool] = -10;

  setTimeout(() => {
    removeEntity(world, tool);
    MainPlayer.action[eid] = MainPlayerAction.IDLE;
    damageResource(state, resourceTargetId!, selectedTool.damage);
  }, 500);
}

export const setMainPlayerEntity = (world: World, eid: number) => {
  addComponent(world, MainPlayer, eid);

  /* Add collider to entity */
  addComponent(world, Collider, eid);
  Collider.offsetX[eid] = 0;
  Collider.offsetY[eid] = 0;
  Collider.sizeWidth[eid] = 16;
  Collider.sizeHeight[eid] = 16;
  Collider.scale[eid] = 1;
  Collider.group[eid] = GameObjectGroups.PLAYER;

  addComponent(world, Velocity, eid);
  Velocity.x[eid] = 0;
  Velocity.y[eid] = 0;

  addComponent(world, Range, eid);
  Range.radius[eid] = 32;
};
