import { every } from '@shared';
import { addComponent, addEntity, debugEntity, defineQuery, defineSystem, enterQuery, removeEntity, World } from '@virtcon2/bytenetc';
import {
  Collider,
  ItemTextureMap,
  MainPlayer,
  MainPlayerAction,
  MiscTextureMap,
  Player,
  Position,
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
const mainPlayerQuery = defineQuery(MainPlayer, Position, Sprite, Player, Collider);
const mainPlayerQueryEnter = enterQuery(mainPlayerQuery);

export const createMainPlayerSystem = (world: World, scene: Phaser.Scene, cursors: Phaser.Types.Input.Keyboard.CursorKeys) => {
  const [keyW, keyA, keyS, keyD, keySpace] = [
    scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
    scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
    scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
    scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
  ];

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

      if (scene.input.keyboard.checkDown(keySpace)) {
        attack(state, world, entities[i]);
      }
      highlightTargets(state, world, entities[i]);
    }
    return state;
  });
};

const getTargetItemIds = (tool: ToolType) =>
  tool.targets
    .map((targetResourceName) => Resources[targetResourceName].item)
    .map(getItemByName)
    .filter((item) => item)
    .map((item) => item!.id);

const getTargetItemIdsMemoized = memoizeWith((tool: ToolType) => tool.item, getTargetItemIds);

const closestResourceQuery = defineQuery(Position, Resource);
const findClosestResource = (world: World, x: number, y: number): [number | undefined, number] => {
  const resources = closestResourceQuery(world);
  let closestResource: number | undefined = undefined;
  let closestDistance = 1000000;
  for (let i = 0; i < resources.length; i++) {
    const resource = resources[i];
    const distance = Math.sqrt(Math.pow(Position.x[resource] - x, 2) + Math.pow(Position.y[resource] - y, 2));
    if (distance < closestDistance) {
      closestResource = resource;
      closestDistance = distance;
    }
  }
  return [closestResource, closestDistance];
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

  const [closestResourceId, distance] = findClosestResource(world, x, y);
  if (!closestResourceId) return;

  const targetItemsIds = getTargetItemIdsMemoized(selectedTool);

  if (distance <= 2 * 16) {
    const canDamage = targetItemsIds.includes(Resource.itemId[closestResourceId]);

    const sprite = state.spritesById[closestResourceId];
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

  const [x, y] = [state.spritesById[eid].x, state.spritesById[eid].y];
  const [resourceTargetId] = findClosestResource(world, x, y);
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
};
