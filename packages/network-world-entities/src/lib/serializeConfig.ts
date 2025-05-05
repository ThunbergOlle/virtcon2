import { Component } from '@virtcon2/bytenetc';
import { Position } from './components/Position';
import { Velocity } from './components/Velocity';
import { tileEntityComponents } from './entities/Tile';
import {
  itemEntityComponents,
  Player,
  playerEntityComponents,
  resourceEntityComponents,
  worldBorderEntityComponents,
  worldBuildingEntityComponents,
} from './network-world-entities';

export enum SerializationID {
  WORLD = 'world',
  WORLD_BORDER = 'world-border',
  PLAYER_MOVEMENT = 'player-movement',
  BUILDING_FULL_SERVER = 'building-full-server',
  PLAYER_FULL_SERVER = 'player-full-server',
  TILE = 'tile',
  RESOURCE = 'resource',
  ITEM = 'item',
}

export const serializeConfig: { [key in SerializationID]: Component<any>[] } = {
  [SerializationID.PLAYER_MOVEMENT]: [Player, Velocity, Position],
  [SerializationID.PLAYER_FULL_SERVER]: playerEntityComponents,
  [SerializationID.BUILDING_FULL_SERVER]: worldBuildingEntityComponents,
  [SerializationID.TILE]: tileEntityComponents,
  [SerializationID.RESOURCE]: resourceEntityComponents,
  [SerializationID.WORLD]: [],
  [SerializationID.ITEM]: itemEntityComponents,
  [SerializationID.WORLD_BORDER]: worldBorderEntityComponents,
};
