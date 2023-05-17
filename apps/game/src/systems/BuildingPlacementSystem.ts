import { IWorld, defineQuery, defineSystem, enterQuery, exitQuery } from '@virtcon2/virt-bit-ecs';

import { MainPlayer } from '../components/MainPlayer';
import { Velocity } from '../components/Velocity';
import { events } from '../events/Events';
import { GameState } from '../scenes/Game';

const mainPlayerQuery = defineQuery([MainPlayer]);
const mainPlayerQueryEnter = enterQuery(mainPlayerQuery);
const mainPlayerQueryExit = exitQuery(mainPlayerQuery);
export const createBuildingPlacementSystem = (scene: Phaser.Scene) => {
  return defineSystem((world: IWorld, state: GameState, _) => {
    const enterEntities = mainPlayerQueryEnter(world);
    // for (let i = 0; i < enterEntities.length; i++) {
    //   /* Add event listeners */
    //   /* Event listener for inventory event */
    //   scene.input.keyboard.on('keydown-E', () => {
    //     events.notify('onInventoryButtonPressed');
    //   });
    //   /* Event listener for crafter event */
    //   scene.input.keyboard.on('keydown-C', () => {
    //     events.notify('onCrafterButtonPressed');
    //   });
    // }
    // const exitEntities = mainPlayerQueryExit(world);
    // for (let i = 0; i < exitEntities.length; i++) {
    //   /* Remove event listeners */
    // }

    return { world, state };
  });
};
