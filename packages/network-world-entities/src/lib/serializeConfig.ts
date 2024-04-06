import { Changed, Component } from 'bitecs';
import { Position } from './components/Position';
import { Velocity } from './components/Velocity';
import { playerEntityComponents } from './network-world-entities';

export enum SerializationID {
  WORLD = 'world',
  PLAYER_MOVEMENT = 'player-movement',
  PLAYER_FULL_SERVER = 'player-full-server',
}

export const serializeConfig: { [key in SerializationID]: Component[] } = {
  [SerializationID.PLAYER_MOVEMENT]: [Position, Changed(Velocity), Position],
  [SerializationID.PLAYER_FULL_SERVER]: playerEntityComponents,
  [SerializationID.WORLD]: [],
};
