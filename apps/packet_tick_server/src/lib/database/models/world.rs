use derive_redis_json::RedisJsonValue;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, RedisJsonValue, Debug, Clone)]
pub struct World {
    pub id: String,
    pub players: Vec<Player>,
    pub buildings: Vec<WorldBuilding>,
    pub resources: Vec<Resource>,
    pub height_map: Vec<Vec<f32>>,
}
#[derive(Serialize, Deserialize, RedisJsonValue, Debug, Clone)]
pub struct WorldBuilding {
    pub id: i32,
    pub building: Option<Building>,
    pub active: bool,
    #[serde(default)]
    pub current_processing_ticks: u32,
    pub x: i32,
    pub y: i32,
    pub rotation: f32,
    pub world_building_inventory: Option<Vec<WorldBuildingInventoryItem>>,
    pub output_world_building: Option<WorldBuildingId>,
    pub output_pos_x: Option<i32>,
    pub output_pos_y: Option<i32>,
}
#[derive(Serialize, Deserialize, RedisJsonValue, Debug, Clone)]
pub struct WorldBuildingId {
    pub id: i32,
}
#[derive(Serialize, Deserialize, RedisJsonValue, Debug, Clone)]
pub struct BuildingProcessingRequirement {
    pub id: i32,
    pub item: BuildingProcessingRequirementItemId,
    pub quantity: i32,
}
#[derive(Serialize, Deserialize, RedisJsonValue, Debug, Clone)]
pub struct BuildingProcessingRequirementItemId {
    pub id: i32,
}
#[derive(Serialize, Deserialize, RedisJsonValue, Debug, Clone)]
pub struct WorldBuildingInventoryItem {
    pub quantity: i32,
    pub slot: i32,
    pub item: Option<WorldBuildingInventoryItemItem>,
}
#[derive(Serialize, Deserialize, RedisJsonValue, Debug, Clone)]
pub struct WorldBuildingInventoryItemItem {
    pub id: i32,
    pub stack_size: i32,
}
#[derive(Serialize, Deserialize, RedisJsonValue, Debug, Clone)]
pub struct Player {
    pub id: String,
    pub name: String,
    pub position: Vec<f32>,
    pub inventory: Vec<InventoryItem>,
    pub socket_id: String,
    pub world_id: String,
}

#[derive(Serialize, Deserialize, RedisJsonValue, Debug, Clone)]
pub struct Building {
    pub id: u32,
    pub processing_ticks: u32,
    pub width: u32,
    pub height: u32,
    pub item: Option<Box<Item>>,
    pub items_to_be_placed_on: Option<Vec<Box<Item>>>,
    pub inventory_slots: u32,
    pub processing_requirements: Option<Vec<BuildingProcessingRequirement>>,
}

#[derive(Serialize, Deserialize, RedisJsonValue, Debug, Clone)]
pub struct InventoryItem {
    pub quantity: i32,
    pub item: Option<Item>,
    pub slot: i32,
}

#[derive(Serialize, Deserialize, RedisJsonValue, Debug, Clone)]
pub struct Item {
    pub id: i32,
    pub name: String,
    pub display_name: String,
    pub description: String,
    pub icon: String,
    pub rarity: String,
    pub is_building: bool,
    /* Maybe has items_to_be_placed_on */
    pub building: Option<Building>,
}

#[derive(Serialize, Deserialize, RedisJsonValue, Debug, Clone)]
pub struct Resource {
    pub id: i32,
    pub x: i32,
    pub y: i32,
    pub item: ResourceItem,
}
#[derive(Serialize, Deserialize, RedisJsonValue, Debug, Clone)]
pub struct ResourceItem {
    pub id: i32,
    pub name: String,
}
