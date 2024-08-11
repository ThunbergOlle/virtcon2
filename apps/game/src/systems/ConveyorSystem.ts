import { defineQuery, defineSystem, enterQuery, World } from '@virtcon2/bytenetc';
import { Conveyor, getTextureFromTextureId, getVariantName, Position, Sprite } from '@virtcon2/network-world-entities';
import { GameState } from '../scenes/Game';
import { fromPhaserPos } from '../ui/lib/coordinates';

const conveyorQuery = defineQuery(Conveyor, Sprite);
const conveyorEnterQuery = enterQuery(conveyorQuery);

export const createConveyorSystem = (world: World) => {
  return defineSystem<GameState>((state) => {
    const enterEntities = conveyorEnterQuery(world);

    if (enterEntities.length === 0) return state;

    const entities = conveyorQuery(world);

    for (let i = 0; i < enterEntities.length; i++) {
      const { x, y } = fromPhaserPos({ x: Position.x[enterEntities[i]], y: Position.y[enterEntities[i]] });
      const leftConveyor = entities.find((eid) => {
        const { x: compareX, y: compareY } = fromPhaserPos({ x: Position.x[eid], y: Position.y[eid] });
        if (compareX === x - 1 && compareY === y) return true;
        return false;
      });
      const rightConveyor = entities.find((eid) => {
        const { x: compareX, y: compareY } = fromPhaserPos({ x: Position.x[eid], y: Position.y[eid] });
        if (compareX === x + 1 && compareY === y) return true;
        return false;
      });

      const upConveyor = entities.find((eid) => {
        const { x: compareX, y: compareY } = fromPhaserPos({ x: Position.x[eid], y: Position.y[eid] });
        if (compareX === x && compareY === y - 1) return true;
        return false;
      });
      const downConveyor = entities.find((eid) => {
        const { x: compareX, y: compareY } = fromPhaserPos({ x: Position.x[eid], y: Position.y[eid] });
        if (compareX === x && compareY === y + 1) return true;
        return false;
      });

      const neighbors = {
        left: leftConveyor,
        right: rightConveyor,
        up: upConveyor,
        down: downConveyor,
      };
      // rotation is in radians
      const rotation = Sprite.rotation[enterEntities[i]];
      const sprite = state.spritesById[enterEntities[i]];

      console.log('Conveyor', enterEntities[i], 'at', x, y, 'has neighbors', neighbors, 'and rotation', rotation);

      if (neighbors.left && neighbors.right) continue;
      if (neighbors.up && neighbors.down) continue;
      if (neighbors.left && !neighbors.right) {
        const texture = getTextureFromTextureId(Sprite.texture[enterEntities[i]]);
        if (!texture) throw new Error('Texture not found for id: ' + Sprite.texture[enterEntities[i]]);

        const textureName = getVariantName(texture, Sprite.variant[enterEntities[i]]);

        sprite.setTexture(textureName);
        sprite.anims.play(textureName + '_anim_idle_corner');

        continue;
      }
      if (neighbors.left && neighbors.down) {
        Sprite.variant[enterEntities[i]] = 1;
        continue;
      }
    }

    return state;
  });
};
