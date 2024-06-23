import { IWorld, Not, defineQuery, defineSystem, enterQuery } from 'bitecs';

import { MainPlayer, Player } from '@virtcon2/network-world-entities';
import { GameState } from '../scenes/Game';
import { setMainPlayerEntity } from './MainPlayerSystem';

const playerQuery = defineQuery([Player, Not(MainPlayer)]);
const playerQueryEnter = enterQuery(playerQuery);

export const createPlayerSystem = (mainPlayerId: number) => {
  return defineSystem<[], [IWorld, GameState]>(([world, state]) => {
    const enterEntities = playerQueryEnter(world);
    for (let i = 0; i < enterEntities.length; i++) {
      const eid = enterEntities[i];
      console.log(
        `Player ${Player.userId[eid]} has entered the world. Is main player: ${Player.userId[eid] === mainPlayerId}, total players: ${enterEntities.length}`,
      );
      if (Player.userId[eid] === mainPlayerId) {
        setMainPlayerEntity(world, eid);
      }
    }

    return [world, state];
  });
};
