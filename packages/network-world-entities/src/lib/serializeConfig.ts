import { Component } from '@virtcon2/bytenetc';
import { Position } from './components/Position';
import { Velocity } from './components/Velocity';
import { Player, playerEntityComponents } from './network-world-entities';

export enum SerializationID {
  WORLD = 'world',
  PLAYER_MOVEMENT = 'player-movement',
  PLAYER_FULL_SERVER = 'player-full-server',
}

export const serializeConfig: { [key in SerializationID]: Component<any>[] } = {
  [SerializationID.PLAYER_MOVEMENT]: [Player, Velocity, Position],
  [SerializationID.PLAYER_FULL_SERVER]: playerEntityComponents,
  [SerializationID.WORLD]: [],
};
