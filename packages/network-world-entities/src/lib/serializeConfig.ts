import { Component, World } from '@virtcon2/bytenetc';
import { Position } from './components/Position';
import { Velocity } from './components/Velocity';
import { tileEntityComponents } from './entities/Tile';
import {
  harvestableEntityComponents,
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
  HARVESTABLE = 'harvestable',
}

export type SerializeConfig = {
  [key in SerializationID]: Component<any>[];
};
export const getSerializeConfig = (world: World): SerializeConfig => ({
  [SerializationID.PLAYER_MOVEMENT]: [Player, Velocity, Position].map((c) => c(world)),
  [SerializationID.PLAYER_FULL_SERVER]: playerEntityComponents.map((c) => c(world)),
  [SerializationID.BUILDING_FULL_SERVER]: worldBuildingEntityComponents.map((c) => c(world)),
  [SerializationID.TILE]: tileEntityComponents.map((c) => c(world)),
  [SerializationID.RESOURCE]: resourceEntityComponents.map((c) => c(world)),
  [SerializationID.WORLD]: [],
  [SerializationID.ITEM]: itemEntityComponents.map((c) => c(world)),
  [SerializationID.WORLD_BORDER]: worldBorderEntityComponents.map((c) => c(world)),
  [SerializationID.HARVESTABLE]: harvestableEntityComponents.map((c) => c(world)),
});
