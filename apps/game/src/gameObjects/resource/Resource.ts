import { ResourceNames } from '@shared';
import { TileCoordinates, toPhaserPos } from '../../ui/lib/coordinates';
import Game from '../../scenes/Game';

export default class Resource {
  public gameObject: Phaser.GameObjects.Sprite | null = null;

  protected scene: Phaser.Scene;

  protected type: ResourceNames;
  public position = new Phaser.Math.Vector2(0, 0);

  constructor(scene: Phaser.Scene, resourceType: ResourceNames) {
    this.scene = scene;
    this.type = resourceType;
  }

  spawnGameObject(pos: TileCoordinates) {
    const { x, y } = toPhaserPos({ x: pos.x, y: pos.y });
    if (this.gameObject != null) this.gameObject.destroy();

    /* Make sprite */
    const sprite = this.scene.physics.add.sprite(x, y, Resources[this.type].sprite.toString());
    // create collider
    // move collider to center
    sprite.body.setSize(Resources[this.type].width * 16, Resources[this.type].height * 16);
    sprite.body.setOffset(0.5 * Resources[this.type].height * 16, 0);
    sprite.setScale(1);
    sprite.body.setImmovable(true);

    this.scene.physics.add.collider(Game.mainPlayer.body.gameObject, sprite)


    this.gameObject = sprite;
  }
}

interface ResourcesType {
  sprite: string;
  width: number;
  height: number;
}

export const Resources: Record<ResourceNames, ResourcesType> = {
  [ResourceNames.WOOD]: {
    sprite: 'resource_wood',
    width: 1,
    height: 2,
  },
};
