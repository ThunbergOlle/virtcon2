import { every } from '@shared';
import { addComponent, addReservedEntity, defineQuery, defineSystem, enterQuery, Entity, removeEntity, World } from '@virtcon2/bytenetc';
import {
  Collider,
  GameObjectGroups,
  ItemTextureMap,
  MainPlayer,
  MainPlayerAction,
  Player,
  Position,
  Range,
  Resource,
  Sprite,
  Velocity,
} from '@virtcon2/network-world-entities';
import { getItemByName, Resources, ToolType } from '@virtcon2/static-game-data';
import { memoizeWith } from 'ramda';
import { events } from '../events/Events';
import { GameState } from '../scenes/Game';
import { store } from '../store';
import { currentItem, currentTool } from '../ui/components/hotbar/HotbarSlice';
import { damageResource } from './ResourceSystem';

const speed = 750;

export const createMainPlayerSystem = (world: World, scene: Phaser.Scene, cursors: Phaser.Types.Input.Keyboard.CursorKeys) => {
  const mainPlayerQuery = defineQuery(MainPlayer, Position, Sprite, Player, Collider, Range);
  const mainPlayerQueryEnter = enterQuery(mainPlayerQuery);

  const keyboard = scene.input.keyboard as Phaser.Input.Keyboard.KeyboardPlugin;
  const [keyW, keyA, keyS, keyD, keySpace] = [
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
  ];

  return defineSystem<GameState>((state) => {
    const enterEntities = mainPlayerQueryEnter(world);
    for (let i = 0; i < enterEntities.length; i++) {
      const id = enterEntities[i];

      const sprite = state.spritesById[id];
      if (sprite && sprite.body) {
        scene.cameras.main.startFollow(sprite);
        scene.cameras.main.setZoom(5);
      }

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
        (Number(cursors.right.isDown || keyboard.checkDown(keyD)) - Number(cursors.left.isDown || keyboard.checkDown(keyA))) / 10;
      let yVel: number =
        (Number(cursors.down.isDown || scene.input.keyboard?.checkDown(keyS)) -
          Number(cursors.up.isDown || scene.input.keyboard?.checkDown(keyW))) /
        10;

      // Normalize speed in the diagonals
      if (yVel !== 0 && xVel !== 0) {
        yVel = yVel / 1.5;
        xVel = xVel / 1.5;
      }

      Velocity(world).x[entities[i]] = xVel * speed;
      Velocity(world).y[entities[i]] = yVel * speed;

      if (keyboard.checkDown(keySpace)) {
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

const findResourceInRange = (world: World, playerEid: Entity): Entity | null => {
  const resourceQuery = defineQuery(Position, Resource);
  const resources = resourceQuery(world);

  let closestResourceEid: Entity | null = null;
  let cloestDistance = Number.MAX_VALUE;

  for (let i = 0; i < resources.length; i++) {
    const resource = resources[i];
    const resourceX = Position(world).x[resource];
    const resourceY = Position(world).y[resource];
    const playerX = Position(world).x[playerEid];
    const playerY = Position(world).y[playerEid];

    const distance = Phaser.Math.Distance.Between(playerX, playerY, resourceX, resourceY);
    if (distance < Range(world).radius[playerEid] && distance < cloestDistance) {
      cloestDistance = distance;
      closestResourceEid = resource;
    }
  }

  return closestResourceEid;
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

  const targetItemsIds = getTargetItemIdsMemoized(selectedTool);

  const resourceId = findResourceInRange(world, eid);
  if (resourceId !== null) {
    const canDamage = targetItemsIds.includes(Resource(world).itemId[resourceId]);

    const sprite = state.spritesById[resourceId];
    if (highlightedSprite) highlightedSprite.resetPipeline();
    sprite.setPipeline('outline');
    highlightedSprite = sprite;

    if (canDamage) sprite.pipeline.set4f('uOutlineColor', 0, 1, 0, 1);
    else sprite.pipeline.set4f('uOutlineColor', 1, 0, 0, 1);
  } else highlightedSprite?.resetPipeline();
};

function attack(state: GameState, world: World, eid: number) {
  if (MainPlayer(world).action[eid] !== MainPlayerAction.IDLE) return;

  const selectedItem = currentItem(store.getState());
  if (!selectedItem?.item) return;
  const selectedTool = currentTool(store.getState());
  if (!selectedTool) return;

  const textureId = ItemTextureMap[selectedItem.item.name]?.textureId;
  if (!textureId) throw new Error(`Texture not found for tool: ${selectedItem}`);

  const resourceTargetId = findResourceInRange(world, eid);
  if (resourceTargetId === null) return;

  const targetItemsIds = getTargetItemIdsMemoized(selectedTool);
  if (!targetItemsIds.includes(Resource(world).itemId[resourceTargetId!])) return;

  MainPlayer(world).action[eid] = MainPlayerAction.ATTACKING;

  const sprite = state.spritesById[eid];
  const animationName = `player_character_0_anim_cut`;

  sprite.anims.play(animationName, true);

  const tool = addReservedEntity(world, 2998);
  addComponent(world, Sprite, tool);

  Sprite(world).texture[tool] = textureId;
  Sprite(world).dynamicBody[tool] = 1;
  Sprite(world).variant[tool] = 0;

  addComponent(world, Position, tool);
  Position(world).x[tool] = Position(world).x[resourceTargetId];
  Position(world).y[tool] = Position(world).y[resourceTargetId] - 10;

  setTimeout(() => state.spritesById[resourceTargetId!].clearTint(), 100);

  addComponent(world, Velocity, tool);
  Velocity(world).x[tool] = 0;
  Velocity(world).y[tool] = -10;

  setTimeout(() => {
    removeEntity(world, tool);
    MainPlayer(world).action[eid] = MainPlayerAction.IDLE;
    damageResource(world, state, resourceTargetId!, selectedTool.damage);
  }, 500);
}

export const setMainPlayerEntity = (world: World, eid: number) => {
  addComponent(world, MainPlayer, eid);

  /* Add collider to entity */
  addComponent(world, Collider, eid);
  Collider(world).offsetX[eid] = 0;
  Collider(world).offsetY[eid] = 0;
  Collider(world).sizeWidth[eid] = 16;
  Collider(world).sizeHeight[eid] = 16;
  Collider(world).group[eid] = GameObjectGroups.PLAYER;

  addComponent(world, Velocity, eid);
  Velocity(world).x[eid] = 0;
  Velocity(world).y[eid] = 0;

  addComponent(world, Range, eid);
  Range(world).radius[eid] = 32;
};
