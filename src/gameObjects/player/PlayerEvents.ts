import { Scene } from "phaser";
import { Player } from "./Player";
import { events } from "../../events/Events";

export class PlayerEvents {
    private player: Player
    private scene: Scene
    private isInventoryOpen: boolean = false
    
    constructor(scene: Phaser.Scene, player: Player) {
        this.scene = scene;
        this.player = player;
        this.setupListeners();
    }

    setupListeners() {
        console.log("Setting up player listeners")
        // on press "E" key
        this.scene.input.keyboard.on("keydown-E", () => {
            if (this.isInventoryOpen) {
                this.isInventoryOpen = false;
                events.notify("onPlayerInventoryClosed")
                return
            }else {
                events.notify("onPlayerInventoryOpened", this.player)
                this.isInventoryOpen = true
            }

        })  
    }
}