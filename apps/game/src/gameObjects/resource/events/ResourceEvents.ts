import { Scene } from 'phaser';
import Resource from '../Resource';

export class ResourceEvents {
  private scene: Scene;
  private resource: Resource;

  constructor(scene: Phaser.Scene, resource: Resource) {
    this.scene = scene;
    this.resource = resource;
    this.setupListeners();
  }

  setupListeners() {
    if (this.resource.gameObject == null) {
      throw new Error('Cannot setup listeners for a resource without a gameObject');
    }
    // on click resource
    this.resource.gameObject.on(
      Phaser.Input.Events.POINTER_DOWN,
      () => {
        /* Future security improvements:  Send resource damage package.*/
        /* Currently, backend does not check if the destroy resource is legit. */
        this.resource.damage(1);
      },
      this.resource.gameObject.parentContainer,
    );
  }
  destroy() {
    this.resource.gameObject?.removeAllListeners();
  }
}
