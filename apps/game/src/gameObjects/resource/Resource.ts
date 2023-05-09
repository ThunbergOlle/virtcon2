import { ResourceNames, Resources } from '@virtcon2/static-game-data';
import Game from '../../scenes/Game';
import { TileCoordinates, toPhaserPos } from '../../ui/lib/coordinates';
import { ResourceEvents } from './events/ResourceEvents';

export default class Resource {
  public gameObject: Phaser.GameObjects.Sprite | null = null;
  private resourceEvents: ResourceEvents | null = null;
  protected scene: Phaser.Scene;

  protected type: ResourceNames;
  public position = new Phaser.Math.Vector2(0, 0);
  public health: number;

  constructor(scene: Phaser.Scene, resourceType: ResourceNames) {
    this.scene = scene;
    this.type = resourceType;
    this.health = Resources[this.type].full_health;
  }

  destroyGameObject() {
    this.health = 0;
    if (this.gameObject != null) {
      this.gameObject.destroy();
    }
    if (this.resourceEvents != null) {
      this.resourceEvents.destroy();
    }
  }
  spawnGameObject(pos: TileCoordinates) {
    const { x, y } = toPhaserPos({ x: pos.x, y: pos.y });
    if (this.gameObject != null) this.destroyGameObject();

    this.health = Resources[this.type].full_health;

    /* Make sprite */
    const sprite = this.scene.physics.add.sprite(x, y, Resources[this.type].sprite.toString());

    // move collider to center
    sprite.body.setSize(Resources[this.type].width * 16, Resources[this.type].height * 16);
    sprite.body.setOffset(0.5 * Resources[this.type].height * 16, 0);
    sprite.setScale(1);
    sprite.body.setImmovable(true);
    sprite.setInteractive();
    this.scene.physics.add.collider(Game.mainPlayer.body.gameObject, sprite);

    this.gameObject = sprite;
    this.resourceEvents = new ResourceEvents(this.scene, this);
  }
  damage(amount: number) {
    this.health -= amount;
    if (this.health <= 0) {
      /* TODO: Network: Send destroyed resource packet */
      console.log("resource destroyed.. Adding to inventory")

      /* Reset health, to make the resource destroyable again. */
      this.health = Resources[this.type].full_health;
    }
  }
  destroy() {
    this.destroyGameObject();
  }
}
