import { IWorld } from 'bitecs';

const worlds: IWorld[] = [];

export const newEntityWorld = (world: IWorld) => {
  worlds.push(world);
};
