import { Building, BuildingType } from "./Building";

export abstract class Factory extends Building {
    constructor(scene: Phaser.Scene, id: number, type: BuildingType, x: number, y: number) {
        super(scene, id, type, x, y);
        
    }
    
}