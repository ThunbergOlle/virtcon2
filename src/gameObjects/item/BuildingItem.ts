import { Pipe } from "../buildings/Pipe";
import Item, { ItemType } from "./Item";

export class BuildingItem extends Item {
    constructor (scene: Phaser.Scene, type: ItemType, amount: number) {
        super(scene, type, amount)
    }
    getBuildingType(){
        switch (this.type) {
            case ItemType.BUILDING_PIPE:
                return Pipe;
            default:
                throw new Error("Building type not found");
        }
    }
    placeBuilding(x: number, y: number) {
        
        const id = Math.floor(Math.random() * 1000); // TODO: this id should come from backend
        
        const Building = this.getBuildingType();
        
        const building = new Building(this.scene,id, x, y);

        return building;
    }   
    createGhostBuilding(x: number, y: number) {
        const gameObject = this.scene.add.sprite(x, y, this.type.toString());
        gameObject.alpha= 0.5;
        return gameObject;
    }

}