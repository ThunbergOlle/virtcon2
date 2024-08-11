export * from './lib/network-world-entities';
export * from './lib/SpriteMap';
import { Conveyor } from './lib/components/Conveyor';
import { Building, Collider, GhostBuilding, MainPlayer, Player, Position, Resource, Sprite, Tag, Velocity } from './lib/network-world-entities';

export const allComponents = [Building, Collider, GhostBuilding, MainPlayer, Player, Position, Resource, Sprite, Tag, Velocity, Conveyor];
