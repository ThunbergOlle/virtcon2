import { defineQuery, defineSystem, enterQuery, Entity, World } from '@virtcon2/bytenetc';
import { Building, Conveyor, getTextureFromTextureId, getVariantName, Position, Sprite } from '@virtcon2/network-world-entities';
import { GameState } from '../scenes/Game';
import { fromPhaserPos } from '../ui/lib/coordinates';

const conveyorQuery = defineQuery(Conveyor, Sprite);
const conveyorEnterQuery = enterQuery(conveyorQuery);

export const createConveyorSystem = (world: World) => {
  return defineSystem<GameState>((state) => {
    const enterEntities = conveyorEnterQuery(world);

    if (enterEntities.length === 0) return state;

    for (let i = 0; i < enterEntities.length; i++) {
      updateConveyorAnimations(state, world, enterEntities[i]);
    }

    return state;
  });
};

export const updateConveyorAnimations = (state: GameState, world: World, entity: Entity) => {
  const entities = conveyorQuery(world);
  const { x, y } = fromPhaserPos({ x: Position.x[entity], y: Position.y[entity] });
  const connectedConveyors = entities.filter((eid) => {
    return Building.outputX[eid] === x && Building.outputY[eid] === y;
  });

  const left = connectedConveyors.find((eid) => {
    const { x: xComp, y: yComp } = fromPhaserPos({ x: Position.x[eid], y: Position.y[eid] });
    return xComp === x - 1 && yComp === y;
  });
  const right = connectedConveyors.find((eid) => {
    const { x: xComp, y: yComp } = fromPhaserPos({ x: Position.x[eid], y: Position.y[eid] });
    return xComp === x + 1 && yComp === y;
  });
  const up = connectedConveyors.find((eid) => {
    const { x: xComp, y: yComp } = fromPhaserPos({ x: Position.x[eid], y: Position.y[eid] });
    return xComp === x && yComp === y - 1;
  });
  const down = connectedConveyors.find((eid) => {
    const { x: xComp, y: yComp } = fromPhaserPos({ x: Position.x[eid], y: Position.y[eid] });
    return xComp === x && yComp === y + 1;
  });

  const rotation = Sprite.rotation[entity];
  const sprite = state.spritesById[entity];

  const texture = getTextureFromTextureId(Sprite.texture[entity]);
  if (!texture) throw new Error('Texture not found for id: ' + Sprite.texture[entity]);
  const textureName = getVariantName(texture, Sprite.variant[entity]);

  if (rotation === 90 || rotation === 270) {
    sprite.resetFlip();
    if (left && right) return sprite.anims.play(textureName + '_anim_idle');
    if (up || down) return sprite.anims.play(textureName + '_anim_idle');

    sprite.anims.play(textureName + '_anim_idle_corner_1');

    if (left && !right && rotation === 90) {
      sprite.setFlip(false, false);
    }
    if (left && !right && rotation === 270) {
      sprite.setFlip(false, true);
    }
    if (!left && right && rotation === 90) {
      sprite.setFlip(false, true);
    }
    if (!left && right && rotation === 270) {
      return;
    }
  }
  if (rotation === 0 || rotation === 180) {
    if (up && down) return;

    const texture = getTextureFromTextureId(Sprite.texture[entity]);
    if (!texture) throw new Error('Texture not found for id: ' + Sprite.texture[entity]);
    const textureName = getVariantName(texture, Sprite.variant[entity]);

    sprite.setTexture(textureName);
    sprite.anims.play(textureName + '_anim_idle');

    sprite.resetFlip();
    if (up && !down && rotation === 0) {
      sprite.setFlip(false, false);
    }
    if (up && !down && rotation === 180) {
      sprite.setFlip(false, true);
    }
    if (!up && down && rotation === 0) {
      sprite.setFlip(false, true);
    }
    if (!up && down && rotation === 180) {
      return;
    }
  }
};
