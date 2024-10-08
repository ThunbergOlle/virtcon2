import { Collider, MainPlayer, MainPlayerAction, MiscTextureMap, Player, Position, Resource, Sprite, Velocity } from '@virtcon2/network-world-entities';
import { events } from '../events/Events';
import Game, { GameObjectGroups, GameState } from '../scenes/Game';
import { addComponent, addEntity, defineQuery, defineSystem, enterQuery, removeEntity, World } from '@virtcon2/bytenetc';
import { useSelector } from 'react-redux';
import { store } from '../store';
import { currentTool } from '../ui/components/hotbar/HotbarSlice';
import { toast } from 'react-toastify';
import { get_item_by_id } from '@virtcon2/static-game-data';
import { ClientPacket, PacketType, RequestDestroyResourcePacket } from '@virtcon2/network-packet';
import { client } from '../App';
import { PLAYER_INVENTORY_QUERY } from '../ui/windows/playerInventory/PlayerInventory';
import { damageResource } from './ResourceSystem';

const speed = 750;
const mainPlayerQuery = defineQuery(MainPlayer, Position, Sprite, Player, Collider);
const mainPlayerQueryEnter = enterQuery(mainPlayerQuery);

export const createMainPlayerSystem = (world: World, scene: Phaser.Scene, cursors: Phaser.Types.Input.Keyboard.CursorKeys) => {
  const [keyW, keyA, keyS, keyD, keySpace] = [
    scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
    scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
    scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
    scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
  ];

  return defineSystem<GameState>((state) => {
    const enterEntities = mainPlayerQueryEnter(world);
    for (let i = 0; i < enterEntities.length; i++) {
      const id = enterEntities[i];

      const texture = state.spritesById[id];
      if (texture && texture.body) {
        /* Follow the main character */
        scene.cameras.main.startFollow(texture);
        scene.cameras.main.setZoom(3);
      }
      /* Add event listeners */
      /* Event listener for inventory event */
      scene.input.keyboard.on('keydown-E', () => {
        events.notify('onInventoryButtonPressed');
      });
      /* Event listener for crafter event */
      scene.input.keyboard.on('keydown-C', () => {
        events.notify('onCrafterButtonPressed');
      });

      // Add keys
    }
    const entities = mainPlayerQuery(world);
    for (let i = 0; i < entities.length; i++) {
      let xVel: number =
        (Number(cursors.right.isDown || scene.input.keyboard.checkDown(keyD)) - Number(cursors.left.isDown || scene.input.keyboard.checkDown(keyA))) / 10;
      let yVel: number =
        (Number(cursors.down.isDown || scene.input.keyboard.checkDown(keyS)) - Number(cursors.up.isDown || scene.input.keyboard.checkDown(keyW))) / 10;

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
    }
    return state;
  });
};

const closestResourceQuery = defineQuery(Position, Resource);
function attack(state: GameState, world: World, eid: number) {
  if (MainPlayer.action[eid] !== MainPlayerAction.IDLE) return;

  const selectedTool = currentTool(store.getState());
  if (selectedTool === 'none') return;

  const textureId = MiscTextureMap[`tool_${selectedTool}`]?.textureId;
  if (!textureId) throw new Error(`Texture not found for tool: ${selectedTool}`);

  const closestResources = closestResourceQuery(world);

  let resourceTargetId = null;
  let distanceBetween = 1000000;
  for (let i = 0; i < closestResources.length; i++) {
    const resource = closestResources[i];
    const distance = Math.sqrt(Math.pow(Position.x[eid] - Position.x[resource], 2) + Math.pow(Position.y[eid] - Position.y[resource], 2));

    if (distance <= 2 * 16) {
      if (!resourceTargetId || distance < distanceBetween) {
        resourceTargetId = resource;
        distanceBetween = distance;
      }
    }
  }
  if (resourceTargetId === null) return;

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
  setTimeout(() => state.spritesById[resourceTargetId].clearTint(), 100);

  addComponent(world, Velocity, tool);
  Velocity.x[tool] = 0;
  Velocity.y[tool] = -10;

  setTimeout(() => {
    removeEntity(world, tool);
    MainPlayer.action[eid] = MainPlayerAction.IDLE;
    damageResource(state, resourceTargetId, 1);
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
