import { every } from '@shared';
import { addComponent, defineQuery, defineSystem, enterQuery, World } from '@virtcon2/bytenetc';
import {
  Collider,
  GameObjectGroups,
  ItemTextureMap,
  MainPlayer,
  MainPlayerAction,
  Player,
  Position,
  Range,
  Sprite,
  Velocity,
} from '@virtcon2/network-world-entities';
import { getItemByName, Resources, ToolType } from '@virtcon2/static-game-data';
import { memoizeWith } from 'ramda';
import { events } from '../events/Events';
import { GameState } from '../scenes/Game';
import { store } from '../store';
import { currentItem, currentTool } from '../ui/components/hotbar/HotbarSlice';
import { hoveredResource } from '../ui/components/resourceTooltip/ResourceTooltipSlice';
import { isTryingToPlaceBuilding } from '../ui/lib/buildingPlacement';
import { damageResource, shakeResourceSprite } from './ResourceSystem';

const speed = 750;

export const createMainPlayerSystem = (world: World, scene: Phaser.Scene, cursors: Phaser.Types.Input.Keyboard.CursorKeys) => {
  const mainPlayerQuery = defineQuery(MainPlayer, Position, Sprite, Player, Collider, Range);
  const mainPlayerQueryEnter = enterQuery(mainPlayerQuery);

  const keyboard = scene.input.keyboard as Phaser.Input.Keyboard.KeyboardPlugin;
  const [keyW, keyA, keyS, keyD] = [
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
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

      /* Event listener for mouse click to attack */
      scene.input.on('pointerdown', () => {
        if (isTryingToPlaceBuilding()) return;
        attackClickedResource(state, world, id);
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

const shouldUpdateHighlight = every(30);
let highlightedSprite: Phaser.GameObjects.Sprite | null = null;
const highlightTargets = (state: GameState, world: World, playerEid: number) => {
  if (!shouldUpdateHighlight()) return;

  const hovered = hoveredResource(store.getState());
  if (!hovered) {
    highlightedSprite?.resetPipeline();
    return;
  }

  const selectedTool = currentTool(store.getState());
  if (!selectedTool) {
    highlightedSprite?.resetPipeline();
    return;
  }

  const targetItemsIds = getTargetItemIdsMemoized(selectedTool);
  const canDamage = targetItemsIds.includes(hovered.itemId);

  // Check if resource is in range
  const resourceX = Position(world).x[hovered.eid];
  const resourceY = Position(world).y[hovered.eid];
  const playerX = Position(world).x[playerEid];
  const playerY = Position(world).y[playerEid];
  const distance = Phaser.Math.Distance.Between(playerX, playerY, resourceX, resourceY);
  const inRange = distance < Range(world).radius[playerEid];

  const sprite = state.spritesById[hovered.eid];
  if (!sprite) {
    highlightedSprite?.resetPipeline();
    return;
  }

  if (highlightedSprite) highlightedSprite.resetPipeline();
  sprite.setPipeline('outline');
  highlightedSprite = sprite;

  // Green if in range AND can damage, red otherwise
  if (inRange && canDamage) {
    sprite.pipeline.set4f('uOutlineColor', 0, 1, 0, 1);
  } else {
    sprite.pipeline.set4f('uOutlineColor', 1, 0, 0, 1);
  }
};

function attackClickedResource(state: GameState, world: World, playerEid: number) {
  // Check if player is idle
  if (MainPlayer(world).action[playerEid] !== MainPlayerAction.IDLE) return;

  // Get hovered resource from Redux
  const hovered = hoveredResource(store.getState());
  if (!hovered) return;

  // Validate tool is selected
  const selectedItem = currentItem(store.getState());
  if (!selectedItem?.item) return;
  const selectedTool = currentTool(store.getState());
  if (!selectedTool) return;

  const textureId = ItemTextureMap[selectedItem.item.name]?.textureId;
  if (!textureId) return;

  // Validate resource is within range
  const resourceX = Position(world).x[hovered.eid];
  const resourceY = Position(world).y[hovered.eid];
  const playerX = Position(world).x[playerEid];
  const playerY = Position(world).y[playerEid];
  const distance = Phaser.Math.Distance.Between(playerX, playerY, resourceX, resourceY);
  if (distance >= Range(world).radius[playerEid]) return;

  // Validate tool can damage resource type
  const targetItemsIds = getTargetItemIdsMemoized(selectedTool);
  if (!targetItemsIds.includes(hovered.itemId)) return;

  // Execute attack
  MainPlayer(world).action[playerEid] = MainPlayerAction.ATTACKING;

  const sprite = state.spritesById[playerEid];
  const animationName = `player_character_0_anim_cut`;

  sprite.anims.play(animationName, true);

  setTimeout(() => {
    shakeResourceSprite(state, hovered.eid);
  }, 300);

  setTimeout(() => {
    MainPlayer(world).action[playerEid] = MainPlayerAction.IDLE;
    damageResource(world, state, hovered.eid, selectedTool.damage);
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
