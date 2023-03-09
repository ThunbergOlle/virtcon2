import { Item } from "src/gameClasses/Item";
import { BuildingType } from "./buildingType";

export class ServerBuilding {
    id: string
    pos: { x: number; y: number } = { x: 0, y: 0 };
    inventory: Item[] = [];
    buildingType: BuildingType;
    
    constructor(id: string, buildingType: BuildingType){
        this.id = id;
        this.buildingType = buildingType
    }
    setPos(pos: { x: number; y: number }) {
        this.pos = pos;
    }
}